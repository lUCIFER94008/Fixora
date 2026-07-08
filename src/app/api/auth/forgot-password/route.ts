import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ detail: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user in MongoDB
    const user = await User.findOne({ email: normalizedEmail });

    // Security: Never reveal whether the email exists or not.
    // Always return success message to prevent email enumeration.
    if (!user) {
      // Intentional delay to prevent timing attacks
      await new Promise(r => setTimeout(r, 800));
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent."
      });
    }

    // Generate a secure random token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any previous token and store the new one
    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    // Send the reset email
    try {
      await sendPasswordResetEmail(normalizedEmail, user.name, resetToken);
    } catch (emailError: any) {
      console.error("[FORGOT-PASSWORD] Email send failed:", emailError.message);
      // Clear the token since email failed
      await User.findByIdAndUpdate(user._id, {
        $unset: { resetToken: 1, resetTokenExpiry: 1 }
      });
      return NextResponse.json(
        { detail: "Failed to send reset email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent."
    });
  } catch (err: any) {
    console.error("[FORGOT-PASSWORD] Server error:", err);
    return NextResponse.json({ detail: "Server error. Please try again." }, { status: 500 });
  }
}
