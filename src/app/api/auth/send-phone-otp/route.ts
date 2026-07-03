import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";
import { sendOTP } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ detail: "Phone number is required" }, { status: 400 });
    }

    // Check if phone number is already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json({ detail: "Phone number is already registered" }, { status: 400 });
    }

    // Trigger Twilio Verify send process
    const isSent = await sendOTP(phone);
    if (!isSent) {
      return NextResponse.json({ detail: "Failed to dispatch SMS OTP via Twilio" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "SMS OTP sent successfully."
    });
  } catch (err: any) {
    console.error("Send-phone-otp route error:", err);
    return NextResponse.json({ detail: "Server error during SMS OTP generation." }, { status: 500 });
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
