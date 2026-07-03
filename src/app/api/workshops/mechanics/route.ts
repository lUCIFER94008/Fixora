import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Workshop, Mechanic } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const ws = await Workshop.findOne({ owner_id: tokenUser._id });
    if (!ws) {
      return NextResponse.json([]);
    }

    const list = await Mechanic.find({ workshop_id: ws._id }).sort({ created_at: -1 });
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("Mechanics GET error:", err);
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

    const ws = await Workshop.findOne({ owner_id: tokenUser._id });
    if (!ws) {
      return NextResponse.json({ detail: "Workshop not found for this user account" }, { status: 404 });
    }

    const { name, specialty, phone } = await req.json();

    if (!name || !specialty || !phone) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }

    const newM = await Mechanic.create({
      workshop_id: ws._id,
      name,
      specialty,
      phone,
      status: "Available"
    });

    return NextResponse.json(newM);
  } catch (err: any) {
    console.error("Mechanics POST error:", err);
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
