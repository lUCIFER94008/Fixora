import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, OtpVerification } from "@/models/Schemas";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    let email = "";
    let phone = "";
    
    try {
      const body = await req.json();
      email = body?.email || "";
      phone = body?.phone || "";
    } catch (parseErr) {
      // Gracefully handle empty or malformed body
    }

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

    // Link email and phone together in the verification document
    if (email && phone) {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes session
      
      await OtpVerification.findOneAndUpdate(
        { email },
        {
          $set: {
            phone,
            emailOTP: "pending_email",
            smsOTP: "pending_sms",
            expiresAt,
            verifiedEmail: false,
            verifiedPhone: false
          }
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Register-check error:", err);
    if (err.message && err.message.includes("connection")) {
      return NextResponse.json({ detail: "Unable to connect to MongoDB." }, { status: 500 });
    }
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
