import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const list = await Vehicle.find({ owner_id: tokenUser._id }).sort({ created_at: -1 });
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("Vehicles GET error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { make, model, year, license_plate, mileage, fuel_type } = await req.json();

    if (!make || !model || !year || !license_plate || !mileage || !fuel_type) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate plates
    const existing = await Vehicle.findOne({ license_plate });
    if (existing) {
      return NextResponse.json({ detail: "License plate already registered" }, { status: 400 });
    }

    const newCar = await Vehicle.create({
      owner_id: tokenUser._id,
      make,
      model,
      year,
      license_plate,
      mileage,
      fuel_type
    });

    return NextResponse.json(newCar);
  } catch (err: any) {
    console.error("Vehicles POST error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
