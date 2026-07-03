import { NextResponse } from "next/server";
import { sendComplaintUpdate } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { phone, ticket_title, status } = await req.json();

    if (!phone || !ticket_title || !status) {
      return NextResponse.json({ detail: "Missing required parameters (phone, ticket_title, status)" }, { status: 400 });
    }

    const result = await sendComplaintUpdate(phone, ticket_title, status);
    return NextResponse.json({ success: result });
  } catch (err: any) {
    console.error("send-status API error:", err);
    return NextResponse.json({ detail: "Failed to dispatch status update SMS" }, { status: 500 });
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
