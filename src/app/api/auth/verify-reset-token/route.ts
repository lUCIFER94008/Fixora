import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token?.trim()) {
      return NextResponse.json(
        { valid: false, detail: "Missing reset token." },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, detail: "Reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (err: any) {
    console.error("[VERIFY-RESET-TOKEN] Error:", err);
    return NextResponse.json({ valid: false, detail: "Server error." }, { status: 500 });
  }
}
