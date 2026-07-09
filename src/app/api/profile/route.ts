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
      about,
      // Extended Settings Fields
      emergency_contact,
      cover_image,
      experience_years,
      supported_vehicles,
      certifications,
      gst_number,
      map_location,
      accept_bookings,
      auto_accept,
      enable_chat,
      enable_ai,
      enable_reviews,
      max_daily_bookings,
      slot_duration,
      working_days,
      notification_settings,
      // Owner Profile Fields
      gender,
      dob
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
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (pincode !== undefined) user.pincode = pincode;
    if (emergency_contact !== undefined) user.emergency_contact = emergency_contact;
    
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

        if (emergency_contact !== undefined) ws.emergency_contact = emergency_contact;
        if (cover_image !== undefined) ws.cover_image = cover_image;
        if (experience_years !== undefined) ws.experience_years = Number(experience_years);
        if (supported_vehicles && Array.isArray(supported_vehicles)) ws.supported_vehicles = supported_vehicles;
        if (certifications && Array.isArray(certifications)) ws.certifications = certifications;
        if (gst_number !== undefined) ws.gst_number = gst_number;
        if (map_location !== undefined) ws.map_location = map_location;
        if (accept_bookings !== undefined) ws.accept_bookings = Boolean(accept_bookings);
        if (auto_accept !== undefined) ws.auto_accept = Boolean(auto_accept);
        if (enable_chat !== undefined) ws.enable_chat = Boolean(enable_chat);
        if (enable_ai !== undefined) ws.enable_ai = Boolean(enable_ai);
        if (enable_reviews !== undefined) ws.enable_reviews = Boolean(enable_reviews);
        if (max_daily_bookings !== undefined) ws.max_daily_bookings = Number(max_daily_bookings);
        if (slot_duration !== undefined) ws.slot_duration = Number(slot_duration);
        if (working_days && Array.isArray(working_days)) ws.working_days = working_days;
        
        if (notification_settings && typeof notification_settings === "object") {
          ws.notification_settings = {
            ...ws.notification_settings,
            ...notification_settings
          };
        }
        
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
