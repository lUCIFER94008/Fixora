import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const startTime = Date.now();

  // ── 1. Parse body ────────────────────────────────
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body. Expected JSON." }, { status: 400 });
  }

  const { email } = body;
  console.log(`[FORGOT-PASSWORD] Request received for: ${email}`);

  if (!email?.trim()) {
    return NextResponse.json({ detail: "Email address is required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ── 2. Connect to MongoDB ────────────────────────
  try {
    await connectToDatabase();
    console.log("[FORGOT-PASSWORD] MongoDB connected.");
  } catch (dbErr: any) {
    console.error("[FORGOT-PASSWORD] MongoDB connection failed:", dbErr.message);
    return NextResponse.json(
      { detail: "Database connection failed. Please try again in a moment." },
      { status: 503 }
    );
  }

  // ── 3. Look up user ──────────────────────────────
  let user: any = null;
  try {
    user = await User.findOne({ email: normalizedEmail }).select("_id name email");
    console.log(`[FORGOT-PASSWORD] User lookup: ${user ? "found" : "not found"}`);
  } catch (lookupErr: any) {
    console.error("[FORGOT-PASSWORD] User lookup error:", lookupErr.message);
    return NextResponse.json(
      { detail: "Database query failed. Please try again." },
      { status: 500 }
    );
  }

  // Security: Never reveal whether email exists (timing-safe)
  if (!user) {
    await new Promise((r) => setTimeout(r, 800));
    console.log("[FORGOT-PASSWORD] Email not found — returning generic success (anti-enumeration).");
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent. Please check your inbox."
    });
  }

  // ── 4. Generate reset token ──────────────────────
  let resetToken: string;
  let resetTokenExpiry: Date;
  try {
    resetToken = crypto.randomBytes(32).toString("hex");
    resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    console.log("[FORGOT-PASSWORD] Reset token generated.");
  } catch (cryptoErr: any) {
    console.error("[FORGOT-PASSWORD] Token generation failed:", cryptoErr.message);
    return NextResponse.json(
      { detail: "Failed to generate reset token. Please try again." },
      { status: 500 }
    );
  }

  // ── 5. Store token in MongoDB ────────────────────
  try {
    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });
    console.log("[FORGOT-PASSWORD] Reset token saved to MongoDB.");
  } catch (saveErr: any) {
    console.error("[FORGOT-PASSWORD] Token save failed:", saveErr.message);
    return NextResponse.json(
      { detail: "Failed to save reset token. Please try again." },
      { status: 500 }
    );
  }

  // ── 6. Send email ────────────────────────────────
  try {
    await sendPasswordResetEmail(normalizedEmail, user.name, resetToken);
    console.log(`[FORGOT-PASSWORD] Reset email sent to ${normalizedEmail} in ${Date.now() - startTime}ms.`);
  } catch (emailErr: any) {
    console.error("[FORGOT-PASSWORD] Email send failed:", emailErr.message);

    // Clear the token since email failed
    try {
      await User.findByIdAndUpdate(user._id, {
        $unset: { resetToken: 1, resetTokenExpiry: 1 },
      });
    } catch (_) {}

    // Return the exact SMTP error to the client
    const msg = emailErr.message || "Unknown email error";
    if (msg.includes("Missing EMAIL_SERVER_USER") || msg.includes("Missing EMAIL_SERVER_PASSWORD")) {
      return NextResponse.json(
        { detail: "Email service is not configured. Please contact support." },
        { status: 503 }
      );
    }
    if (msg.includes("SMTP authentication") || msg.includes("EAUTH") || msg.includes("535")) {
      return NextResponse.json(
        { detail: "Email authentication failed. Please contact support." },
        { status: 503 }
      );
    }
    if (msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT") || msg.includes("ENOTFOUND")) {
      return NextResponse.json(
        { detail: "Email server is unreachable. Please try again in a moment." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { detail: `Failed to send reset email: ${msg}` },
      { status: 500 }
    );
  }

  // ── 7. Success ───────────────────────────────────
  return NextResponse.json({
    success: true,
    message: "If an account with that email exists, a reset link has been sent. Please check your inbox."
  });
}

// CORS preflight
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
