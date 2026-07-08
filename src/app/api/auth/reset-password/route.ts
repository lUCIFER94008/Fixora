import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
  return null;
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Something went wrong." }, { status: 400 });
  }

  const { token, password, confirmPassword } = body;

  if (!token?.trim()) {
    return NextResponse.json({ detail: "Invalid reset link." }, { status: 400 });
  }
  if (!password?.trim()) {
    return NextResponse.json({ detail: "Something went wrong." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ detail: "Passwords do not match." }, { status: 400 });
  }

  const strengthError = validatePassword(password);
  if (strengthError) {
    return NextResponse.json({ detail: strengthError }, { status: 400 });
  }

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ detail: "Something went wrong." }, { status: 503 });
  }

  // Hash incoming raw token to query
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  let user: any = null;
  try {
    user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });
  } catch {
    return NextResponse.json({ detail: "Something went wrong." }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ detail: "Reset link expired." }, { status: 400 });
  }

  // Hash new password using bcrypt
  let hashedPassword_hash: string;
  try {
    hashedPassword_hash = await bcrypt.hash(password, 12);
  } catch {
    return NextResponse.json({ detail: "Something went wrong." }, { status: 500 });
  }

  // Update password and clear reset token fields (prevent token reuse)
  try {
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword_hash,
      password_hash: hashedPassword_hash,
      $unset: {
        resetPasswordToken: 1,
        resetPasswordExpires: 1,
        resetToken: 1,
        resetTokenExpiry: 1
      },
    });
  } catch {
    return NextResponse.json({ detail: "Something went wrong." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Password updated successfully."
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
