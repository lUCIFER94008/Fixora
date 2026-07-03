import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Mechanic } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await Mechanic.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Mechanic records removed successfully" });
  } catch (err: any) {
    console.error("Mechanic delete error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
