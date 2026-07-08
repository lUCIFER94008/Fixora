import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/db";

/**
 * GET /api/auth/debug-email
 * 
 * Diagnostic endpoint — checks MongoDB connection and SMTP configuration.
 * Returns detailed status for each component.
 * 
 * ⚠️ IMPORTANT: Remove or protect this endpoint before going to production.
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // ── 1. Environment Variables ──────────────────────
  results.env = {
    MONGODB_URI: !!process.env.MONGODB_URI ? "SET ✓" : "MISSING ✗",
    EMAIL_SERVER_USER: !!process.env.EMAIL_SERVER_USER ? "SET ✓" : "MISSING ✗",
    EMAIL_SERVER_PASSWORD: !!process.env.EMAIL_SERVER_PASSWORD ? "SET ✓" : "MISSING ✗",
    EMAIL_FROM: process.env.EMAIL_FROM || "NOT SET",
    SMTP_HOST: process.env.SMTP_HOST || "NOT SET (default: smtp.gmail.com)",
    SMTP_PORT: process.env.SMTP_PORT || "NOT SET (default: 587)",
    SMTP_SECURE: process.env.SMTP_SECURE || "NOT SET (default: false)",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
  };

  // ── 2. MongoDB ────────────────────────────────────
  try {
    await connectToDatabase();
    results.mongodb = { status: "Connected ✓" };
  } catch (err: any) {
    results.mongodb = { status: "Failed ✗", error: err.message };
  }

  // ── 3. SMTP Verification ──────────────────────────
  const smtpUser = process.env.EMAIL_SERVER_USER;
  const smtpPass = process.env.EMAIL_SERVER_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  if (!smtpUser || !smtpPass) {
    results.smtp = {
      status: "Skipped — missing credentials ✗",
      EMAIL_SERVER_USER: !!smtpUser,
      EMAIL_SERVER_PASSWORD: !!smtpPass,
    };
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await new Promise<void>((resolve, reject) => {
        transporter.verify((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      results.smtp = {
        status: "Connected ✓",
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser.substring(0, 4) + "***",
      };
    } catch (smtpErr: any) {
      results.smtp = {
        status: "Failed ✗",
        error: smtpErr.message,
        code: smtpErr.code,
        host: smtpHost,
        port: smtpPort,
      };
    }
  }

  // ── 4. Reset URL Preview ──────────────────────────
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  results.resetUrlPreview = `${baseUrl}/reset-password?token=SAMPLE_TOKEN`;

  const allOk = results.mongodb?.status?.includes("✓") && results.smtp?.status?.includes("✓");

  return NextResponse.json(results, {
    status: allOk ? 200 : 503,
    headers: { "Content-Type": "application/json" },
  });
}
