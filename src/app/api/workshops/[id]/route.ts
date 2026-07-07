import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Workshop } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ws = await Workshop.findById(id).populate("owner_id", "name email phone profile_image");
    if (!ws) {
      return NextResponse.json({ detail: "Workshop not found" }, { status: 404 });
    }

    return NextResponse.json(ws);
  } catch (err: any) {
    console.error("Workshop GET detail error:", err);
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
