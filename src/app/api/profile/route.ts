import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, Workshop, Vehicle } from "@/models/Schemas";
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
    const { 
      name, 
      phone, 
      profileImage, 
      profile_image,
      // Workshop Fields
      workshopName,
      address,
      city,
      state,
      pincode,
      working_hours,
      services,
      about
    } = body;

    const user = await User.findById(tokenUser._id);
    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    // Phone validation
    if (phone && phone.trim().length < 10) {
      return NextResponse.json({ detail: "Invalid phone number (must be at least 10 digits)" }, { status: 400 });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    const finalImg = profileImage || profile_image;
    if (finalImg) {
      user.profileImage = finalImg;
      user.profile_image = finalImg;
    }

    await user.save();

    let updatedWorkshop = null;
    if (user.role === "workshop") {
      const ws = await Workshop.findOne({ owner_id: user._id });
      if (ws) {
        if (workshopName) ws.name = workshopName;
        if (address) ws.address = address;
        if (city) ws.city = city;
        if (state) ws.state = state;
        if (pincode) ws.pincode = pincode;
        if (phone) ws.phone = phone;
        if (working_hours) ws.working_hours = working_hours;
        if (services && Array.isArray(services)) ws.services = services;
        if (about !== undefined) ws.about = about;
        
        await ws.save();
        updatedWorkshop = ws;
      }
    }

    return NextResponse.json({
      user,
      workshop: updatedWorkshop
    });
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
