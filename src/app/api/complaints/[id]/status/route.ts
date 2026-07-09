import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Complaint } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";
import { triggerStatusNotification } from "@/lib/email";

export async function PUT(
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
    const { status, technician_notes, estimated_cost, estimated_completion, repair_image } = await req.json();

    const comp = await Complaint.findById(id);
    if (!comp) {
      return NextResponse.json({ detail: "Complaint not found" }, { status: 404 });
    }

    const oldStatus = comp.status;

    if (status) {
      comp.status = status;
      if (status === "Accepted" && tokenUser.role === "workshop") {
        comp.workshop_id = tokenUser._id;
      }
    }
    if (technician_notes !== undefined) comp.technician_notes = technician_notes;
    if (estimated_cost !== undefined) comp.estimated_cost = estimated_cost;
    if (estimated_completion !== undefined) comp.estimated_completion = estimated_completion;
    if (repair_image) comp.repair_images.push(repair_image);

    comp.updated_at = new Date();
    await comp.save();

    let emailStatus = "Skipped";
    if (status && status !== oldStatus) {
      emailStatus = await triggerStatusNotification(id, status, status === "Cancelled" ? technician_notes : undefined);
    }

    return NextResponse.json({ ...comp.toObject(), emailStatus });
  } catch (err: any) {
    console.error("Complaint status PUT error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
