import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { TempOtp } from "@/models/Schemas";
import { signTokenWithExpiry } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ detail: "Email and OTP parameters are required" }, { status: 400 });
    }

    const tempOtp = await TempOtp.findOne({ email });
    if (!tempOtp) {
      return NextResponse.json({ detail: "OTP code has expired or was not requested." }, { status: 400 });
    }

    // Check maximum attempts lock
    if (tempOtp.attempts >= 5) {
      return NextResponse.json({ detail: "Maximum verification attempts exceeded. Please request a new OTP." }, { status: 400 });
    }

    // Validate email OTP
    const isMatch = bcrypt.compareSync(otp, tempOtp.hashedOtp);
    if (!isMatch) {
      tempOtp.attempts += 1;
      await tempOtp.save();
      return NextResponse.json({ 
        detail: `Invalid verification code. ${5 - tempOtp.attempts} attempts remaining.` 
      }, { status: 400 });
    }

    // Valid OTP - clean up the temp OTP document
    await TempOtp.deleteOne({ email });

    // Issue signed email verification token
    const token = signTokenWithExpiry({ email, verified: true }, "10m");

    return NextResponse.json({
      success: true,
      token
    });
  } catch (err: any) {
    console.error("Verify-email-otp route error:", err);
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
