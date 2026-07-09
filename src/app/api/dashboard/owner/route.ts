import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vehicle, Complaint, Invoice, Workshop, Notification, User } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (tokenUser.role !== "owner" && tokenUser.role !== "admin") {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    const ownerId = tokenUser._id;

    // Fetch latest user details to get plan fields
    const userDetail = await User.findById(ownerId).select("plan vehicleLimit paymentStatus");

    // Fetch registered vehicles
    const vehicles = await Vehicle.find({ owner_id: ownerId }).sort({ created_at: -1 });

    // Fetch complaints with populated details
    const complaints = await Complaint.find({ owner_id: ownerId })
      .populate("owner_id", "name email phone profile_image")
      .populate("vehicle_id")
      .populate("workshop_id", "name email phone profile_image")
      .sort({ created_at: -1 });

    // Fetch invoices
    const invoices = await Invoice.find({ owner_id: ownerId.toString() }).sort({ created_at: -1 });

    const url = new URL(req.url);
    const latStr = url.searchParams.get("lat");
    const lngStr = url.searchParams.get("lng");
    const userLat = latStr ? parseFloat(latStr) : null;
    const userLng = lngStr ? parseFloat(lngStr) : null;

    // Fetch workshops (populating owner info to show contact coordinates)
    const workshops = await Workshop.find({})
      .populate("owner_id", "name email phone profile_image")
      .lean();

    workshops.sort((a: any, b: any) => {
      // 1. Verified first
      const aVerified = a.is_verified ? 1 : 0;
      const bVerified = b.is_verified ? 1 : 0;
      if (aVerified !== bVerified) {
        return bVerified - aVerified;
      }

      // 2. Nearest first (if user location available)
      if (userLat !== null && userLng !== null) {
        const distA = Math.pow((a.latitude || 18.5204) - userLat, 2) + Math.pow((a.longitude || 73.8567) - userLng, 2);
        const distB = Math.pow((b.latitude || 18.5204) - userLat, 2) + Math.pow((b.longitude || 73.8567) - userLng, 2);
        if (distA !== distB) {
          return distA - distB;
        }
      }

      // 3. Newest first
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    // Fetch read/unread notifications
    const notifications = await Notification.find({ user_id: ownerId.toString() })
      .sort({ created_at: -1 })
      .limit(20);

    return NextResponse.json({
      vehicles,
      complaints,
      invoices,
      workshops,
      notifications,
      userPlan: {
        plan: userDetail?.plan || "FREE",
        vehicleLimit: userDetail?.vehicleLimit ?? 2,
        paymentStatus: userDetail?.paymentStatus || "FREE"
      }
    });
  } catch (err: any) {
    console.error("Owner Dashboard GET error:", err);
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
