import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Message } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all unread messages for the logged-in user
    const unreadMessages = await Message.find({
      receiverId: tokenUser._id,
      isSeen: false
    });

    const roomCounts: Record<string, number> = {};
    unreadMessages.forEach(msg => {
      if (msg.complaintId) {
        roomCounts[msg.complaintId] = (roomCounts[msg.complaintId] || 0) + 1;
      }
    });

    return NextResponse.json({
      total: unreadMessages.length,
      rooms: roomCounts
    });
  } catch (err: any) {
    console.error("Chat unread count error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
