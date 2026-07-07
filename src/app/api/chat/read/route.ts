import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Message, Complaint } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { complaintId } = await req.json().catch(() => ({}));
    if (!complaintId) {
      return NextResponse.json({ detail: "Missing complaintId" }, { status: 400 });
    }

    // Mark messages received by current user as read in this room
    await Message.updateMany(
      { complaintId, receiverId: tokenUser._id, isSeen: false },
      { $set: { isSeen: true } }
    );

    const complaint = await Complaint.findById(complaintId);
    if (complaint) {
      const otherUser = complaint.owner_id.toString() === tokenUser._id.toString() ? complaint.workshop_id : complaint.owner_id;
      if (otherUser) {
        const io = (global as any).io;
        if (io) {
          io.to(otherUser.toString()).emit("SEEN", {
            sender_id: tokenUser._id,
            complaint_id: complaintId
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Chat read PATCH error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
