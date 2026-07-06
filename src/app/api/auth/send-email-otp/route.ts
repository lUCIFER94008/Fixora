import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User, OtpVerification } from "@/models/Schemas";
import { sendEmailOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    let email = "";
    try {
      const body = await req.json();
      email = body?.email || "";
    } catch (e) {}

    if (!email) {
      return NextResponse.json({ detail: "Email address is required" }, { status: 400 });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ detail: "Email is already registered" }, { status: 400 });
    }

    // Generate 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailOTP = bcrypt.hashSync(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Upsert into otp_verifications collection
    await OtpVerification.findOneAndUpdate(
      { email },
      {
        $set: {
          emailOTP,
          expiresAt,
          verifiedEmail: false
        },
        $setOnInsert: {
          phone: "",
          smsOTP: "pending_sms",
          verifiedPhone: false
        }
      },
      { upsert: true, new: true }
    );

    // Dispatch Nodemailer message
    try {
      await sendEmailOTP(email, otp);
    } catch (smtpErr: any) {
      console.error("[SMTP DISPATCH ERROR] sendEmailOTP failed:", smtpErr.message);
      
      // Clean up verification document if SMTP failed
      await OtpVerification.deleteOne({ email });

      const specificErrors = [
        "SMTP authentication failed",
        "Invalid Gmail App Password",
        "EMAIL_SERVER_USER is missing",
        "EMAIL_SERVER_PASSWORD is missing",
        "Unable to connect to SMTP server"
      ];
      
      if (specificErrors.includes(smtpErr.message)) {
        return NextResponse.json({ detail: smtpErr.message }, { status: 500 });
      }
      return NextResponse.json({ detail: smtpErr.message || "Failed to dispatch email verification message" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Email OTP sent successfully."
    });
  } catch (err: any) {
    console.error("Send-email-otp route error:", err);
    if (err.message && err.message.includes("connection")) {
      return NextResponse.json({ detail: "Unable to connect to MongoDB." }, { status: 500 });
    }
    return NextResponse.json({ detail: err.message || "Server error during email OTP generation." }, { status: 500 });
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
