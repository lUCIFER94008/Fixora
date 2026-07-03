import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { phone, code, otp } = await req.json();
    const finalCode = code || otp;

    if (!phone || !finalCode) {
      return NextResponse.json({ detail: "Phone and code parameters are required" }, { status: 400 });
    }

    const isValid = await verifyOTP(phone, finalCode);
    return NextResponse.json({ success: isValid });
  } catch (err: any) {
    console.error("verify-otp API error:", err);
    return NextResponse.json({ detail: "OTP verification failed" }, { status: 500 });
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
