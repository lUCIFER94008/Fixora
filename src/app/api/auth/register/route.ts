import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, Workshop } from "@/models/Schemas";
import { signToken, verifyTokenString } from "@/lib/jwt";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { 
      email, 
      phone, 
      name, 
      password, 
      role, 
      profile_image, 
      workshop_name, 
      workshop_address,
      phoneVerificationToken,
      emailVerificationToken
    } = body;

    if (!email || !phone || !name || !password) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }

    if (!phoneVerificationToken || !emailVerificationToken) {
      return NextResponse.json({ detail: "SMS and Email OTP verifications are required before account creation." }, { status: 400 });
    }

    // Cryptographically verify phone verification token
    const decodedPhone = verifyTokenString(phoneVerificationToken);
    if (!decodedPhone || decodedPhone.phone !== phone || !decodedPhone.verified) {
      return NextResponse.json({ detail: "Phone verification check failed or token has expired." }, { status: 400 });
    }

    // Cryptographically verify email verification token
    const decodedEmail = verifyTokenString(emailVerificationToken);
    if (!decodedEmail || decodedEmail.email !== email || !decodedEmail.verified) {
      return NextResponse.json({ detail: "Email verification check failed or token has expired." }, { status: 400 });
    }

    // Double check email and phone registration
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ detail: "Email is already registered" }, { status: 400 });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json({ detail: "Phone number is already registered" }, { status: 400 });
    }

    // Safe Cloudinary Image Upload
    const profile_image_input = profile_image || body.profileImage;
    let profileImageUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250";
    if (profile_image_input) {
      try {
        const uploadResult = await uploadToCloudinary(profile_image_input, "profiles");
        profileImageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary upload failed, falling back to mock driver image:", uploadErr);
      }
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = bcrypt.hashSync(password, saltRounds);

    // Create the User document
    const user = await User.create({
      name,
      email,
      phone,
      role: role || "owner",
      password_hash,
      password: password_hash,
      profile_image: profileImageUrl,
      profileImage: profileImageUrl,
      provider: "credentials",
      phoneVerified: true,
      emailVerified: true,
      created_at: new Date(),
      createdAt: new Date()
    });

    // If registering as a workshop, seed the Workshop details
    if (role === "workshop") {
      await Workshop.create({
        owner_id: user._id,
        name: workshop_name || "NEON HYPERGARAGE BRANCH",
        address: workshop_address || "Techno Drive, Sector 7",
        phone: phone,
        services: ["General Repair", "EV Diagnostic", "Performance Tuning"],
        capacity: 5,
        is_verified: false,
        rating: 5.0,
        review_count: 0,
        created_at: new Date()
      });
    }

    // Generate custom JWT token for client outbox calls compatibility
    const tokenPayload = { _id: user._id, email: user.email, role: user.role };
    const access_token = signToken(tokenPayload);

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully.",
      access_token,
      refresh_token: `refresh_${access_token}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    console.error("Register route error:", err);
    return NextResponse.json({ detail: "Server error during registration." }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
