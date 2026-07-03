import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { OtpVerification } from "@/models/Schemas";
import { signTokenWithExpiry } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    let email = "";
    let otp = "";
    try {
      const body = await req.json();
      email = body?.email || "";
      otp = body?.otp || "";
    } catch (e) {}

    if (!email || !otp) {
      return NextResponse.json({ detail: "Email and OTP parameters are required" }, { status: 400 });
    }

    const verification = await OtpVerification.findOne({ email });
    if (!verification) {
      return NextResponse.json({ detail: "OTP expired" }, { status: 400 });
    }

    // Check if expired
    const now = new Date();
    if (now > verification.expiresAt) {
      return NextResponse.json({ detail: "OTP expired" }, { status: 400 });
    }

    // Validate email OTP
    const isMatch = bcrypt.compareSync(otp, verification.emailOTP);
    if (!isMatch) {
      return NextResponse.json({ detail: "Incorrect OTP" }, { status: 400 });
    }

    // Update verifiedEmail state
    verification.verifiedEmail = true;
    await verification.save();

    // Issue signed email verification token (for frontend compatibility)
    const token = signTokenWithExpiry({ email, verified: true }, "10m");

    return NextResponse.json({
      success: true,
      token
    });
  } catch (err: any) {
    console.error("Verify-email-otp route error:", err);
    if (err.message && err.message.includes("connection")) {
      return NextResponse.json({ detail: "Unable to connect to MongoDB." }, { status: 500 });
    }
    return NextResponse.json({ detail: "Server error during Email OTP verification." }, { status: 500 });
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
