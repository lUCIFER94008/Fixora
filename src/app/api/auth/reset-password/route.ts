import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";

// Password strength validator
function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter (A–Z).";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter (a–z).";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number (0–9).";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character (!@#$%…).";
  return null;
}

export async function POST(req: Request) {
  // ── 1. Parse body ────────────────────────────────
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body. Expected JSON." }, { status: 400 });
  }

  const { token, password, confirmPassword } = body;

  if (!token?.trim()) {
    return NextResponse.json({ detail: "Reset token is missing." }, { status: 400 });
  }
  if (!password?.trim()) {
    return NextResponse.json({ detail: "New password is required." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ detail: "Passwords do not match." }, { status: 400 });
  }

  // ── 2. Validate password strength ────────────────
  const validationError = validatePassword(password);
  if (validationError) {
    return NextResponse.json({ detail: validationError }, { status: 400 });
  }

  // ── 3. Connect to MongoDB ────────────────────────
  try {
    await connectToDatabase();
  } catch (dbErr: any) {
    console.error("[RESET-PASSWORD] MongoDB connection failed:", dbErr.message);
    return NextResponse.json(
      { detail: "Database connection failed. Please try again in a moment." },
      { status: 503 }
    );
  }

  // ── 4. Find user by token (checks expiry too) ────
  let user: any = null;
  try {
    user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });
  } catch (lookupErr: any) {
    console.error("[RESET-PASSWORD] Token lookup error:", lookupErr.message);
    return NextResponse.json(
      { detail: "Database query failed. Please try again." },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { detail: "Reset link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // ── 5. Hash new password ─────────────────────────
  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (hashErr: any) {
    console.error("[RESET-PASSWORD] bcrypt hashing failed:", hashErr.message);
    return NextResponse.json(
      { detail: "Password hashing failed. Please try again." },
      { status: 500 }
    );
  }

  // ── 6. Update password and clear token ──────────
  try {
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      password_hash: hashedPassword,
      $unset: { resetToken: 1, resetTokenExpiry: 1 },
    });
    console.log(`[RESET-PASSWORD] Password updated successfully for: ${user.email}`);
  } catch (updateErr: any) {
    console.error("[RESET-PASSWORD] Password update failed:", updateErr.message);
    return NextResponse.json(
      { detail: "Failed to update password. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Password reset successfully. You can now log in with your new password."
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
