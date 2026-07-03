import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, phone } = await req.json();

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return NextResponse.json({ detail: "Email already registered." }, { status: 400 });
      }
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return NextResponse.json({ detail: "Phone number already exists." }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Register-check error:", err);
    return NextResponse.json({ detail: "Server error during registration check." }, { status: 500 });
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
