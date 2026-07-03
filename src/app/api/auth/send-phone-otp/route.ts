import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, OtpVerification } from "@/models/Schemas";
import { sendOTP, formatToE164 } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    let phone = "";
    try {
      const body = await req.json();
      phone = body?.phone || "";
    } catch (e) {}

    if (!phone) {
      return NextResponse.json({ detail: "Phone number is required" }, { status: 400 });
    }

    const formattedPhone = formatToE164(phone);

    // Check if phone number is already registered
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return NextResponse.json({ detail: "Phone number is already registered" }, { status: 400 });
    }

    // Trigger Twilio Verify send process
    try {
      await sendOTP(formattedPhone);
    } catch (twilioErr: any) {
      console.error("[TWILIO DISPATCH ERROR] sendOTP failed:", twilioErr.message);
      
      if (twilioErr.message === "Invalid Twilio credentials") {
        return NextResponse.json({ detail: "Invalid Twilio credentials" }, { status: 500 });
      }
      if (twilioErr.message === "Twilio Verify Service SID not found") {
        return NextResponse.json({ detail: "Twilio Verify Service SID not found" }, { status: 500 });
      }
      return NextResponse.json({ detail: twilioErr.message || "Failed to dispatch SMS OTP via Twilio" }, { status: 500 });
    }

    // Update the existing session document with expiresAt and smsOTP state
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await OtpVerification.findOneAndUpdate(
      { phone: formattedPhone },
      {
        $set: {
          smsOTP: "twilio_managed",
          expiresAt,
          verifiedPhone: false
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: "SMS OTP sent successfully."
    });
  } catch (err: any) {
    console.error("Send-phone-otp route error:", err);
    if (err.message && err.message.includes("connection")) {
      return NextResponse.json({ detail: "Unable to connect to MongoDB." }, { status: 500 });
    }
    return NextResponse.json({ detail: err.message || "Server error during SMS OTP generation." }, { status: 500 });
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
