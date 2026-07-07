import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Message, Complaint, Notification } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { complaintId, receiverId, message, attachments, messageType } = body;

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ detail: "Message content or attachments required" }, { status: 400 });
    }

    // 1. If it has a complaintId, verify access
    if (complaintId) {
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        return NextResponse.json({ detail: "Complaint not found" }, { status: 404 });
      }

      // Check security access (Requirement 14)
      const isOwner = complaint.owner_id.toString() === tokenUser._id.toString();
      // A workshop user might be authenticated by workshop_id or direct _id depending on schema. 
      // Let's verify both potential link mechanisms
      const isWorkshop = 
        (complaint.workshop_id && complaint.workshop_id.toString() === tokenUser._id.toString()) ||
        (tokenUser.role === "workshop");
      const isAdmin = tokenUser.role === "admin";

      if (!isOwner && !isWorkshop && !isAdmin) {
        return NextResponse.json({ detail: "Forbidden: You are not authorized to message in this complaint room" }, { status: 403 });
      }
    }

    // 2. Save Message
    const msg = await Message.create({
      complaintId,
      senderId: tokenUser._id,
      receiverId,
      senderRole: tokenUser.role,
      message: message || "",
      attachments: attachments || [],
      messageType: messageType || "text",
      isSeen: false
    });

    const populatedMsg = await Message.findById(msg._id);

    // 3. Socket broadcast if live
    const io = (global as any).io;
    if (io && receiverId) {
      io.to(receiverId.toString()).emit("NEW_MESSAGE", { message: populatedMsg });
    }

    // 4. Offline Notification triggers
    if (receiverId) {
      const isRecipientConnected = io ? io.sockets.adapter.rooms.get(receiverId.toString())?.size > 0 : false;
      if (!isRecipientConnected) {
        await Notification.create({
          user_id: receiverId,
          title: `New message from ${tokenUser.name}`,
          message: message || "Sent an attachment",
          type: "info",
          read: false
        });
        
        if (io) {
          io.to(receiverId.toString()).emit("NOTIFICATION_BADGE_UPDATE", { unread: true });
        }
      }
    }

    return NextResponse.json(populatedMsg);
  } catch (err: any) {
    console.error("Chat send error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
