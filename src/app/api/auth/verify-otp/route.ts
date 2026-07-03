import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ detail: "Missing phone or OTP parameters" }, { status: 400 });
    }

    // Find user by phone number
    const user = await User.findOne({ phone }).sort({ created_at: -1 });
    if (!user) {
      return NextResponse.json({ detail: "No registration matching this phone number" }, { status: 400 });
    }

    // Validate OTP (in our mock setup, 123456 is standard)
    if (otp !== "123456") {
      return NextResponse.json({ detail: "Invalid verification code" }, { status: 400 });
    }

    const tokenPayload = { _id: user._id, email: user.email, role: user.role };
    const access_token = signToken(tokenPayload);

    return NextResponse.json({
      access_token,
      refresh_token: `refresh_${access_token}`,
      token_type: "bearer",
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
    console.error("Verify-otp route error:", err);
    return NextResponse.json({ detail: "Server error during verification." }, { status: 500 });
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
