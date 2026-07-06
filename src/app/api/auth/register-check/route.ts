import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User, OtpVerification } from "@/models/Schemas";
import { sendVerificationOTP } from "@/lib/otp";
import { formatToE164 } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    let email = "";
    let phone = "";
    let name = "";
    
    try {
      const body = await req.json();
      email = body?.email || "";
      phone = body?.phone || "";
      name = body?.name || "";
    } catch (parseErr) {
      // Gracefully handle malformed body
    }

    if (!email || !phone) {
      return NextResponse.json({ detail: "Email and Phone coordinates are required" }, { status: 400 });
    }

    const formattedPhone = formatToE164(phone);

    // 1. Perform availability checks
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ detail: "Email is already registered" }, { status: 400 });
    }

    const existingPhone = await User.findOne({ phone: formattedPhone });
    if (existingPhone) {
      return NextResponse.json({ detail: "Phone number is already registered" }, { status: 400 });
    }

    // 2. Generate secure 6-digit OTP code safely
    let rawOtp = "";
    let hashedEmailOtp = "";
    try {
      rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
      hashedEmailOtp = bcrypt.hashSync(rawOtp, 10);
    } catch (otpErr) {
      console.error("[OTP GENERATION ERROR] bcrypt hashing failed:", otpErr);
      return NextResponse.json({ detail: "OTP generation failed" }, { status: 500 });
    }

    // 3. Dispatch SMS and Email OTP via the sendVerificationOTP helper
    const otpResults = await sendVerificationOTP(email, formattedPhone, rawOtp, name);

    // 4. Handle Case 4 (both SMS and Email failed)
    if (!otpResults.smsSent && !otpResults.emailSent) {
      console.error("[REGISTRATION FAILURE] Both Twilio SMS and SMTP Email dispatches failed.");
      return NextResponse.json(
        { detail: "Unable to send verification code.\nPlease try again later." },
        { status: 500 }
      );
    }

    // 5. Store / Link verification state in MongoDB
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes session
    
    await OtpVerification.findOneAndUpdate(
      { email },
      {
        $set: {
          phone: formattedPhone,
          emailOTP: hashedEmailOtp,
          smsOTP: otpResults.smsSent ? "twilio_managed" : "failed",
          expiresAt,
          verifiedEmail: false,
          verifiedPhone: false
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      smsSent: otpResults.smsSent,
      emailSent: otpResults.emailSent,
      smsError: otpResults.smsError,
      emailError: otpResults.emailError
    });
  } catch (err: any) {
    console.error("Register-check error:", err);
    if (err.message && err.message.includes("connection")) {
      return NextResponse.json({ detail: "Unable to connect to MongoDB." }, { status: 500 });
    }
    return NextResponse.json({ detail: err.message || "Server error during registration check." }, { status: 500 });
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
