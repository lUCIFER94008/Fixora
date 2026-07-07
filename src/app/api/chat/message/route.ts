import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Message } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let messageId = searchParams.get("messageId");

    if (!messageId) {
      const body = await req.json().catch(() => ({}));
      messageId = body.messageId;
    }

    if (!messageId) {
      return NextResponse.json({ detail: "Missing messageId" }, { status: 400 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ detail: "Message not found" }, { status: 404 });
    }

    // Security check: Only message sender or admin can delete it
    if (message.senderId?.toString() !== tokenUser._id.toString() && tokenUser.role !== "admin") {
      return NextResponse.json({ detail: "Forbidden: You cannot delete someone else's message" }, { status: 403 });
    }

    await Message.findByIdAndDelete(messageId);

    // Broadcast deletion via Socket.IO
    const io = (global as any).io;
    if (io) {
      const recipient = message.receiverId;
      if (recipient) {
        io.to(recipient.toString()).emit("DELETE_MESSAGE", { messageId });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Chat delete message error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
