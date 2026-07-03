import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, Complaint, Workshop, Invoice } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser || tokenUser.role !== "admin") {
      return NextResponse.json({ detail: "Unauthorized admin access" }, { status: 401 });
    }

    const total_users = await User.countDocuments({});
    const owners_count = await User.countDocuments({ role: "owner" });
    const workshops_count = await User.countDocuments({ role: "workshop" });
    const total_complaints = await Complaint.countDocuments({});
    const pending_complaints = await Complaint.countDocuments({ status: "Pending" });
    const active_complaints = await Complaint.countDocuments({ status: "In Progress" });
    const completed_complaints = await Complaint.countDocuments({ status: "Completed" });

    // Aggregate total revenue from Paid invoices
    const paidInvoices = await Invoice.find({ status: "Paid" });
    const total_revenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0) || 12000; // Simulated minimum baseline

    const unverified_workshops = await Workshop.find({ is_verified: false });

    // Chart mock templates matching dashboard charts
    const category_chart = { Engine: 15, Brakes: 12, Electrical: 8, Suspension: 7 };
    const monthly_trend = [
      { month: "Jan", complaints: 12, revenue: 14000 },
      { month: "Feb", complaints: 19, revenue: 21000 },
      { month: "Mar", complaints: 24, revenue: 29000 }
    ];

    return NextResponse.json({
      summary: {
        total_users,
        owners_count,
        workshops_count,
        total_complaints,
        pending_complaints,
        active_complaints,
        completed_complaints,
        total_revenue
      },
      unverified_workshops,
      category_chart,
      monthly_trend
    });
  } catch (err: any) {
    console.error("Admin stats GET error:", err);
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
