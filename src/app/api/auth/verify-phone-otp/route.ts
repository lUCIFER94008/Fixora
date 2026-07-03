import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { OtpVerification } from "@/models/Schemas";
import { verifyOTP, formatToE164 } from "@/lib/twilio";
import { signTokenWithExpiry } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    let phone = "";
    let otp = "";
    try {
      const body = await req.json();
      phone = body?.phone || "";
      otp = body?.otp || "";
    } catch (e) {}

    if (!phone || !otp) {
      return NextResponse.json({ detail: "Phone and OTP parameters are required" }, { status: 400 });
    }

    const formattedPhone = formatToE164(phone);

    const verification = await OtpVerification.findOne({ phone: formattedPhone });
    if (!verification) {
      return NextResponse.json({ detail: "OTP expired" }, { status: 400 });
    }

    const now = new Date();
    if (now > verification.expiresAt) {
      return NextResponse.json({ detail: "OTP expired" }, { status: 400 });
    }

    // Call Twilio Verify Checks API to verify the code
    let isValid = false;
    try {
      isValid = await verifyOTP(formattedPhone, otp);
    } catch (twilioErr: any) {
      console.error("[TWILIO VERIFY ERROR] verifyOTP failed:", twilioErr.message);
      
      if (twilioErr.message === "Invalid Twilio credentials") {
        return NextResponse.json({ detail: "Invalid Twilio credentials" }, { status: 500 });
      }
      if (twilioErr.message === "Twilio Verify Service SID not found") {
        return NextResponse.json({ detail: "Twilio Verify Service SID not found" }, { status: 500 });
      }
      return NextResponse.json({ detail: twilioErr.message || "Failed to verify phone OTP via Twilio" }, { status: 500 });
    }

    if (!isValid) {
      return NextResponse.json({ detail: "Incorrect OTP" }, { status: 400 });
    }

    // Update verifiedPhone flag in Mapped Session Document
    verification.verifiedPhone = true;
    await verification.save();

    // Issue signed phone verification token
    const token = signTokenWithExpiry({ phone: formattedPhone, verified: true }, "10m");

    return NextResponse.json({
      success: true,
      token
    });
  } catch (err: any) {
    console.error("Verify-phone-otp route error:", err);
    if (err.message && err.message.includes("connection")) {
      return NextResponse.json({ detail: "Unable to connect to MongoDB." }, { status: 500 });
    }
    return NextResponse.json({ detail: "Server error during SMS verification." }, { status: 500 });
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
