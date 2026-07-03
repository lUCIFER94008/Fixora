import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import clientPromise from "./lib/mongodb";
import { connectToDatabase } from "./lib/db";
import { User, Workshop } from "./models/Schemas";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock_secret",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password_hash) return null;
        
        const isMatch = bcrypt.compareSync(credentials.password as string, user.password_hash);
        if (!isMatch) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.profile_image
        };
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectToDatabase();
        
        let dbUser = await User.findOne({ email: user.email });
        if (!dbUser) {
          // Read selected signup role from cookies
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const chosenRole = cookieStore.get("fixora_selected_role")?.value || "vehicleOwner";
          const finalRole = chosenRole === "workshopOwner" ? "workshop" : "owner";

          dbUser = await User.create({
            name: user.name || "Google Driver",
            email: user.email || "",
            phone: "+919876543210", // Standard fallback Indian format
            role: finalRole,
            profile_image: user.image || undefined,
            profileImage: user.image || undefined,
            provider: "google",
            phoneVerified: true,
            emailVerified: true,
            created_at: new Date(),
            createdAt: new Date()
          });

          // Seed workshop document if registering workshop owner
          if (finalRole === "workshop") {
            await Workshop.create({
              owner_id: dbUser._id,
              name: "NEON HYPERGARAGE BRANCH",
              address: "77 Cyberpunk Boulevard, sector 12",
              phone: "+919876543210",
              services: ["EV Diagnostic", "Performance Tuning"],
              capacity: 8,
              is_verified: false,
              rating: 5.0,
              review_count: 0
            });
          }
        } else {
          // Keep existing user updated with provider settings if missing
          let changed = false;
          if (!dbUser.provider) {
            dbUser.provider = "google";
            changed = true;
          }
          if (dbUser.phoneVerified === undefined) {
            dbUser.phoneVerified = true;
            changed = true;
          }
          if (dbUser.emailVerified === undefined) {
            dbUser.emailVerified = true;
            changed = true;
          }
          if (changed) {
            await dbUser.save();
          }
        }
        
        (user as any).role = dbUser.role;
        user.id = dbUser._id.toString();
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  }
});
