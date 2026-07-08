import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, Workshop } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(tokenUser._id);
    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    let workshop = null;
    if (user.role === "workshop") {
      workshop = await Workshop.findOne({ owner_id: user._id });
    }

    const { Vehicle } = require("@/models/Schemas");
    const vehicleCount = await Vehicle.countDocuments({ owner_id: user._id });

    return NextResponse.json({
      user: {
        ...user.toObject(),
        vehicleCount
      },
      workshop
    });
  } catch (err: any) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, profileImage, profile_image } = body;

    const user = await User.findById(tokenUser._id);
    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profileImage || profile_image) {
      user.profileImage = profileImage || profile_image;
      user.profile_image = profileImage || profile_image;
    }

    await user.save();
    return NextResponse.json(user);
  } catch (err: any) {
    console.error("Profile PATCH error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
