import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ChatMessage } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function GET(
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

    const list = await ChatMessage.find({
      $or: [
        { sender_id: tokenUser._id.toString(), receiver_id: id.toString() },
        { sender_id: id.toString(), receiver_id: tokenUser._id.toString() }
      ]
    }).sort({ created_at: 1 });

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("Chat history GET error:", err);
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
