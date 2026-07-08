import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token?.trim()) {
      return NextResponse.json({ valid: false, detail: "Invalid reset link." }, { status: 400 });
    }

    // Hash raw token with SHA-256 to compare with stored value
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return NextResponse.json({ valid: false, detail: "Reset link expired." }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (err: any) {
    console.error("[VERIFY-RESET-TOKEN] Server error:", err);
    return NextResponse.json({ valid: false, detail: "Something went wrong." }, { status: 500 });
  }
}
