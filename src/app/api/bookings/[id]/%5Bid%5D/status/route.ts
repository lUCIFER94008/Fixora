import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Booking, Notification, Workshop } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function POST(
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
    const body = await req.json().catch(() => ({}));
    const { status } = body;

    const validStatuses = ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ detail: "Invalid status value" }, { status: 400 });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ detail: "Booking not found" }, { status: 404 });
    }

    // Authorization checks
    // Workshop can update status; Owner can cancel their booking
    const isOwner = booking.ownerId === tokenUser._id.toString();
    
    let isWorkshop = false;
    const ws = await Workshop.findOne({ owner_id: tokenUser._id });
    if (ws && booking.workshopId === ws._id.toString()) {
      isWorkshop = true;
    }

    if (!isOwner && !isWorkshop && tokenUser.role !== "admin") {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    if (isOwner && status !== "Cancelled") {
      return NextResponse.json({ detail: "Owners can only cancel bookings" }, { status: 400 });
    }

    booking.status = status;
    await booking.save();

    // Create notifications for Owner
    await Notification.create({
      user_id: booking.ownerId,
      title: `Booking ${status}`,
      message: `Your booking request ${booking.bookingId} with ${booking.workshopName} has been ${status.toLowerCase()}.`,
      type: status === "Accepted" ? "success" : status === "Rejected" || status === "Cancelled" ? "error" : "info",
      read: false
    });

    // Notify workshop if cancelled by owner
    if (isOwner && status === "Cancelled" && ws) {
      await Notification.create({
        user_id: ws.owner_id.toString(),
        title: "Booking Cancelled by Customer",
        message: `Customer ${booking.ownerName} has cancelled booking ${booking.bookingId}.`,
        type: "info",
        read: false
      });
    }

    // Emit live Socket presence updates
    const io = (global as any).io;
    if (io) {
      io.to(booking.ownerId).emit("NOTIFICATION_BADGE_UPDATE", { unread: true });
      io.to(booking.ownerId).emit("BOOKING_STATUS_UPDATE", booking);
      
      const wsDetail = await Workshop.findById(booking.workshopId);
      if (wsDetail?.owner_id) {
        io.to(wsDetail.owner_id.toString()).emit("NOTIFICATION_BADGE_UPDATE", { unread: true });
        io.to(wsDetail.owner_id.toString()).emit("BOOKING_STATUS_UPDATE", booking);
      }
    }

    return NextResponse.json(booking);
  } catch (err: any) {
    console.error("Booking status update error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
