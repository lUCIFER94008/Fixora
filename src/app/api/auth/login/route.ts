import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ detail: "Incorrect email or password" }, { status: 400 });
    }

    // If password hash is not set, handle it
    const passwordHash = user.password_hash || user.password;
    if (!passwordHash) {
      return NextResponse.json({ detail: "Auth method mismatch. Please use social sign-in." }, { status: 400 });
    }

    const isMatch = bcrypt.compareSync(password, passwordHash);
    if (!isMatch) {
      return NextResponse.json({ detail: "Incorrect email or password" }, { status: 400 });
    }

    const tokenPayload = { _id: user._id, email: user.email, role: user.role };
    const access_token = signToken(tokenPayload);

    return NextResponse.json({
      access_token,
      refresh_token: `refresh_${access_token}`,
      token_type: "bearer",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
