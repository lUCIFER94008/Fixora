import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/twilio";
import { signTokenWithExpiry } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ detail: "Phone and OTP parameters are required" }, { status: 400 });
    }

    const isValid = await verifyOTP(phone, otp);
    if (!isValid) {
      return NextResponse.json({ detail: "Invalid phone verification code" }, { status: 400 });
    }

    // Issue signed phone verification token
    const token = signTokenWithExpiry({ phone, verified: true }, "10m");

    return NextResponse.json({
      success: true,
      token
    });
  } catch (err: any) {
    console.error("Verify-phone-otp route error:", err);
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
