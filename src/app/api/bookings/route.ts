import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Booking, User, Vehicle, Workshop, Notification } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";
import { sendBookingEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    let list: any[] = [];
    if (tokenUser.role === "owner") {
      list = await Booking.find({ ownerId: tokenUser._id.toString() }).sort({ createdAt: -1 });
    } else if (tokenUser.role === "workshop") {
      // Find the workshop associated with this owner_id
      const ws = await Workshop.findOne({ owner_id: tokenUser._id });
      if (ws) {
        list = await Booking.find({ workshopId: ws._id.toString() }).sort({ createdAt: -1 });
      }
    } else if (tokenUser.role === "admin") {
      list = await Booking.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("Bookings GET error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (tokenUser.role !== "owner") {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { vehicleId, workshopId, preferredDate, preferredTime, notes, complaintId } = body;

    if (!vehicleId || !workshopId || !preferredDate || !preferredTime) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ detail: "Vehicle not found" }, { status: 404 });
    }

    const workshop = await Workshop.findById(workshopId).populate("owner_id", "name email phone");
    if (!workshop) {
      return NextResponse.json({ detail: "Workshop not found" }, { status: 404 });
    }

    // Generate unique Booking ID
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const bookingId = `BK-${randomHex}`;

    const newBooking = await Booking.create({
      bookingId,
      ownerId: tokenUser._id.toString(),
      ownerName: tokenUser.name,
      ownerPhone: tokenUser.phone || "",
      ownerEmail: tokenUser.email,
      vehicleId: vehicle._id.toString(),
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      workshopId: workshop._id.toString(),
      workshopName: workshop.name,
      complaintId: complaintId || undefined,
      preferredDate,
      preferredTime,
      notes: notes || "",
      status: "Pending"
    });

    // Send confirmation email
    if (tokenUser.email) {
      await sendBookingEmail(tokenUser.email, tokenUser.name, newBooking, "confirmation");
    }

    // Create notifications for Owner
    await Notification.create({
      user_id: tokenUser._id.toString(),
      title: "Booking submitted successfully",
      message: `Your booking request ${bookingId} has been sent. Waiting for workshop confirmation.`,
      type: "info",
      read: false
    });

    // Create notifications for Workshop Owner
    if (workshop.owner_id) {
      const workshopOwnerId = (workshop.owner_id as any)._id || workshop.owner_id;
      await Notification.create({
        user_id: workshopOwnerId.toString(),
        title: "New Repair Booking Request",
        message: `Customer ${tokenUser.name} booked a service slot for ${vehicle.make} ${vehicle.model} on ${preferredDate} at ${preferredTime}.`,
        type: "warning",
        read: false
      });

      // Emit notification badges / triggers via WebSockets if connected
      const io = (global as any).io;
      if (io) {
        io.to(workshopOwnerId.toString()).emit("NOTIFICATION_BADGE_UPDATE", { unread: true });
        io.to(workshopOwnerId.toString()).emit("NEW_BOOKING", newBooking);
      }
    }

    return NextResponse.json(newBooking);
  } catch (err: any) {
    console.error("Booking create error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
