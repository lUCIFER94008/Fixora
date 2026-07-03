import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User, TempOtp } from "@/models/Schemas";
import { sendEmailOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ detail: "Email address is required" }, { status: 400 });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ detail: "Email is already registered" }, { status: 400 });
    }

    // Rate-limiting and resends check on TempOtp
    let tempOtp = await TempOtp.findOne({ email });
    const now = new Date();

    if (tempOtp) {
      // 60 seconds rate limit
      const secondsSinceLastResend = (now.getTime() - tempOtp.lastResendAt.getTime()) / 1000;
      if (secondsSinceLastResend < 60) {
        return NextResponse.json({ 
          detail: `Please wait ${Math.ceil(60 - secondsSinceLastResend)} seconds before requesting another code.` 
        }, { status: 429 });
      }

      // Max 3 resends limit
      if (tempOtp.resends >= 3) {
        return NextResponse.json({ detail: "Maximum email OTP resend limit reached." }, { status: 400 });
      }

      tempOtp.resends += 1;
      tempOtp.lastResendAt = now;
      tempOtp.attempts = 0;
    } else {
      tempOtp = new TempOtp({
        email,
        resends: 0,
        lastResendAt: now,
        attempts: 0
      });
    }

    // Generate 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash before saving
    const saltRounds = 10;
    tempOtp.hashedOtp = bcrypt.hashSync(otp, saltRounds);

    // Save/update the TempOtp record
    await tempOtp.save();

    // Dispatch Nodemailer message
    const isSent = await sendEmailOTP(email, otp);
    if (!isSent) {
      return NextResponse.json({ detail: "Failed to dispatch email verification message" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Email OTP sent successfully."
    });
  } catch (err: any) {
    console.error("Send-email-otp route error:", err);
    return NextResponse.json({ detail: "Server error during email OTP generation." }, { status: 500 });
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
