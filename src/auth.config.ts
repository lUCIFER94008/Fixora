import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      
      const isDashboardRoute = pathname.startsWith("/owner/dashboard") ||
                               pathname.startsWith("/workshop/dashboard") ||
                               pathname.startsWith("/admin/dashboard");

      if (isDashboardRoute) {
        if (!isLoggedIn) return false; // Redirect to login page

        const userRole = (auth.user as any)?.role || "owner";

        // Route checking and auto-redirection based on user role
        if (userRole === "admin" && !pathname.startsWith("/admin")) {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }
        if (userRole === "workshop" && !pathname.startsWith("/workshop")) {
          return Response.redirect(new URL("/workshop/dashboard", nextUrl));
        }
        if (userRole === "owner" && !pathname.startsWith("/owner")) {
          return Response.redirect(new URL("/owner/dashboard", nextUrl));
        }

        return true;
      }
      return true;
    },
  },
  secret: process.env.AUTH_SECRET || "4f7e2a9b3c5d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
} satisfies NextAuthConfig;
