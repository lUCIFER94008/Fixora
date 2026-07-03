import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Workshop } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser || tokenUser.role !== "admin") {
      return NextResponse.json({ detail: "Unauthorized admin access" }, { status: 401 });
    }

    const { id } = await params;
    const ws = await Workshop.findById(id);
    if (!ws) {
      return NextResponse.json({ detail: "Workshop not found" }, { status: 404 });
    }

    ws.is_verified = true;
    await ws.save();

    return NextResponse.json(ws);
  } catch (err: any) {
    console.error("Workshop verify PUT error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
