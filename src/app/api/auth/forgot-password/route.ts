import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";
import { sendPasswordResetEmail } from "@/lib/email";

// Verify required env variables at runtime
function verifyEnv() {
  const required = [
    "NEXTAUTH_URL",
    "MONGODB_URI",
    "EMAIL_SERVER_USER",
    "EMAIL_SERVER_PASSWORD",
    "EMAIL_FROM"
  ];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Critical environment variable missing: ${key}`);
    }
  }
}

export async function POST(req: Request) {
  try {
    verifyEnv();
  } catch (envErr: any) {
    console.error("[FORGOT-PASSWORD] Env check failed:", envErr.message);
    return NextResponse.json({ detail: envErr.message }, { status: 500 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body. Expected JSON." }, { status: 400 });
  }

  const { email } = body;
  if (!email?.trim()) {
    return NextResponse.json({ detail: "Email address is required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Connect to MongoDB
  try {
    await connectToDatabase();
  } catch (dbErr: any) {
    console.error("[FORGOT-PASSWORD] DB connection failed:", dbErr.message);
    return NextResponse.json({ detail: "Database connection failed." }, { status: 503 });
  }

  // 2. Find user
  let user: any = null;
  try {
    user = await User.findOne({ email: normalizedEmail });
  } catch (err: any) {
    return NextResponse.json({ detail: "Database query failed." }, { status: 500 });
  }

  // Anti-enumeration security: always return success
  if (!user) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({
      success: true,
      message: "Reset link sent successfully."
    });
  }

  // 3. Generate raw token and hash it (SHA-256)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

  // 4. Save to user document
  try {
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: resetPasswordExpires,
      // also keep previous fields updated for safety
      resetToken: hashedToken,
      resetTokenExpiry: resetPasswordExpires
    });
  } catch (saveErr: any) {
    return NextResponse.json({ detail: "Reset token generation failed." }, { status: 500 });
  }

  // 5. Send email with raw token
  try {
    await sendPasswordResetEmail(normalizedEmail, user.name, rawToken);
  } catch (emailErr: any) {
    console.error("[FORGOT-PASSWORD] Email failed:", emailErr.message);
    // Rollback token
    await User.findByIdAndUpdate(user._id, {
      $unset: {
        resetPasswordToken: 1,
        resetPasswordExpires: 1,
        resetToken: 1,
        resetTokenExpiry: 1
      }
    });
    return NextResponse.json({ detail: "Unable to send email." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Reset link sent successfully."
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
