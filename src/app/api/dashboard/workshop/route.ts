import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Complaint, Invoice } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (tokenUser.role !== "workshop" && tokenUser.role !== "admin") {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    const workshopUserId = tokenUser._id;

    // Fetch complaints that are either Pending (broadcasted) or assigned to this workshop
    const myComplaints = await Complaint.find({
      $or: [
        { status: "Pending" },
        { workshop_id: workshopUserId }
      ]
    })
      .populate("owner_id", "name email phone profile_image")
      .populate("vehicle_id")
      .populate("workshop_id", "name email phone profile_image")
      .sort({ created_at: -1 });

    // Calculate metrics
    const totalComplaintsCount = await Complaint.countDocuments({ workshop_id: workshopUserId });
    const pendingCount = await Complaint.countDocuments({ status: "Pending" });
    const acceptedCount = await Complaint.countDocuments({ workshop_id: workshopUserId, status: "Accepted" });
    const completedCount = await Complaint.countDocuments({ workshop_id: workshopUserId, status: "Completed" });
    const cancelledCount = await Complaint.countDocuments({ workshop_id: workshopUserId, status: "Cancelled" });

    // Revenue calculation
    const paidInvoices = await Invoice.find({ workshop_id: workshopUserId.toString(), status: "Paid" });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Unique customers count
    const activeComplaints = await Complaint.find({ workshop_id: workshopUserId });
    const customerIds = new Set(activeComplaints.map(c => c.owner_id.toString()));
    const vehicleIds = new Set(activeComplaints.map(c => c.vehicle_id.toString()));

    return NextResponse.json({
      complaints: myComplaints,
      metrics: {
        totalComplaints: totalComplaintsCount,
        pending: pendingCount,
        accepted: acceptedCount,
        completed: completedCount,
        cancelled: cancelledCount,
        revenue: totalRevenue,
        customers: customerIds.size,
        vehicles: vehicleIds.size
      }
    });
  } catch (err: any) {
    console.error("Workshop Dashboard GET error:", err);
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
