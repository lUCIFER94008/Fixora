import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Workshop } from "@/models/Schemas";
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
      // Create a fallback auto-created workshop profile
      const newWs = await Workshop.create({
        owner_id: tokenUser._id,
        name: "NEON HYPERGARAGE BRANCH",
        address: "77 Cyberpunk Boulevard, Sector 12",
        phone: tokenUser.phone || "+1444444444",
        services: ["EV Diagnostic", "Performance Tuning"],
        capacity: 5,
        is_verified: true,
        rating: 5.0,
        review_count: 0
      });
      return NextResponse.json(newWs);
    }

    return NextResponse.json(ws);
  } catch (err: any) {
    console.error("Workshop profile GET error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
