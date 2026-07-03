import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ detail: "Phone parameter is required" }, { status: 400 });
    }

    const result = await sendOTP(phone);
    return NextResponse.json({ success: result });
  } catch (err: any) {
    console.error("send-otp API error:", err);
    return NextResponse.json({ detail: "Failed to dispatch verification code" }, { status: 500 });
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
