import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, Workshop } from "@/models/Schemas";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, phone, name, password, role, profile_image, workshop_name, workshop_address } = body;

    if (!email || !phone || !name || !password) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ detail: "Email already registered" }, { status: 400 });
    }

    const saltRounds = 10;
    const password_hash = bcrypt.hashSync(password, saltRounds);

    // Create the User document
    const user = await User.create({
      name,
      email,
      phone,
      role: role || "owner",
      password_hash,
      profile_image: profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250"
    });

    // If registering as a workshop, seed the Workshop details
    if (role === "workshop") {
      await Workshop.create({
        owner_id: user._id,
        name: workshop_name || "NEON HYPERGARAGE BRANCH",
        address: workshop_address || "Techno Drive, Sector 7",
        phone: phone,
        services: ["General Repair", "EV Diagnostic", "Performance Tuning"],
        capacity: 5,
        is_verified: false,
        rating: 5.0,
        review_count: 0
      });
    }

    // Generate simulated OTP
    const mockOtp = "123456";
    console.log(`[SMS-MOCK] Registered user: ${name}. Dispatching OTP [${mockOtp}] to phone: ${phone}`);

    return NextResponse.json({
      success: true,
      message: "OTP verification code sent successfully.",
      otp: mockOtp,
      phone
    });
  } catch (err: any) {
    console.error("Register route error:", err);
    return NextResponse.json({ detail: "Server error during registration." }, { status: 500 });
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
