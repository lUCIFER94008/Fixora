import { handlers } from "@/auth";
import { POST as forgotPasswordHandler } from "../forgot-password/route";
import { POST as resetPasswordHandler } from "../reset-password/route";
import { GET as verifyResetTokenHandler } from "../verify-reset-token/route";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Bypasses NextAuth handler for custom password reset routes
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname.includes("/verify-reset-token")) {
    return verifyResetTokenHandler(req);
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname.includes("/forgot-password")) {
    return forgotPasswordHandler(req);
  }
  if (url.pathname.includes("/reset-password")) {
    return resetPasswordHandler(req);
  }
  return handlers.POST(req);
}
