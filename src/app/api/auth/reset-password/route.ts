import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";

// Password strength validator
function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
  return null;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { token, password, confirmPassword } = body;

    if (!token?.trim()) {
      return NextResponse.json({ detail: "Reset token is required." }, { status: 400 });
    }
    if (!password?.trim()) {
      return NextResponse.json({ detail: "New password is required." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ detail: "Passwords do not match." }, { status: 400 });
    }

    // Validate password strength
    const validationError = validatePassword(password);
    if (validationError) {
      return NextResponse.json({ detail: validationError }, { status: 400 });
    }

    // Find user by token and check expiry
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { detail: "Reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password with bcrypt (12 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token fields (single-use invalidation)
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      password_hash: hashedPassword,
      $unset: { resetToken: 1, resetTokenExpiry: 1 },
    });

    console.log(`[RESET-PASSWORD] Password updated successfully for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password."
    });
  } catch (err: any) {
    console.error("[RESET-PASSWORD] Server error:", err);
    return NextResponse.json({ detail: "Server error. Please try again." }, { status: 500 });
  }
}
