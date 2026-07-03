import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Invoice, Complaint } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find and update invoice linked to this complaint
    const inv = await Invoice.findOne({ complaint_id: id });
    if (inv) {
      inv.status = "Paid";
      await inv.save();
    }

    // Find and mark complaint as completed
    const comp = await Complaint.findById(id);
    if (comp) {
      comp.status = "Completed";
      comp.updated_at = new Date();
      await comp.save();
    }

    return NextResponse.json({ success: true, message: "Payment settled. Repair ticket closed." });
  } catch (err: any) {
    console.error("Complaint pay POST error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
