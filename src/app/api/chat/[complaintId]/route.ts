import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Message, Complaint } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { complaintId } = await params;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json({ detail: "Complaint not found" }, { status: 404 });
    }

    // Check security access (Requirement 14)
    const isOwner = complaint.owner_id.toString() === tokenUser._id.toString();
    const isWorkshop = 
      (complaint.workshop_id && complaint.workshop_id.toString() === tokenUser._id.toString()) ||
      (tokenUser.role === "workshop");
    const isAdmin = tokenUser.role === "admin";

    if (!isOwner && !isWorkshop && !isAdmin) {
      return NextResponse.json({ detail: "Forbidden: Access to this conversation room is restricted" }, { status: 403 });
    }

    // Closed flag check
    const isClosed = ["Completed", "Delivered", "Cancelled"].includes(complaint.status);

    // Load messages sorted by creation time
    const messages = await Message.find({ complaintId }).sort({ createdAt: 1 });

    // Mark messages received by current user as read
    await Message.updateMany(
      { complaintId, receiverId: tokenUser._id, isSeen: false },
      { $set: { isSeen: true, status: "Seen" } }
    );

    // Notify other sender via Socket that messages were seen
    const otherUser = isOwner ? complaint.workshop_id : complaint.owner_id;
    if (otherUser) {
      const io = (global as any).io;
      if (io) {
        io.to(otherUser.toString()).emit("SEEN", {
          sender_id: tokenUser._id,
          complaint_id: complaintId
        });
      }
    }

    return NextResponse.json({
      complaint,
      messages,
      isClosed
    });
  } catch (err: any) {
    console.error("Chat fetch room error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
