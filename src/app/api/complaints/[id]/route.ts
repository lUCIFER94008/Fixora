import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Complaint, Notification } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";
import { triggerStatusNotification } from "@/lib/email";

export async function GET(
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
    const comp = await Complaint.findById(id)
      .populate("owner_id", "name email phone profile_image")
      .populate("vehicle_id")
      .populate("workshop_id", "name email phone profile_image");

    if (!comp) {
      return NextResponse.json({ detail: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json(comp);
  } catch (err: any) {
    console.error("Complaint GET detail error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await req.json();
    const { 
      status, 
      technician_notes, 
      estimated_cost, 
      estimated_completion, 
      repair_image, 
      assigned_mechanic_id 
    } = body;

    const comp = await Complaint.findById(id);
    if (!comp) {
      return NextResponse.json({ detail: "Complaint not found" }, { status: 404 });
    }

    // Security check: Only workshops or admins can change status, cost, completion, notes
    if (status || technician_notes || estimated_cost || estimated_completion || repair_image || assigned_mechanic_id) {
      if (tokenUser.role !== "workshop" && tokenUser.role !== "admin") {
        return NextResponse.json({ detail: "Only Workshops can update repair status and estimates" }, { status: 403 });
      }
    }

    // Apply updates
    const oldStatus = comp.status;
    if (status) {
      comp.status = status;
      
      // If accepting complaint, link workshop ID
      if (status === "Accepted" && tokenUser.role === "workshop") {
        comp.workshop_id = tokenUser._id;
      }

      // Create notification for owner on status transitions
      if (oldStatus !== status) {
        let notificationTitle = "Repair Update";
        let notificationMsg = `Your complaint status has changed to ${status}.`;

        if (status === "Accepted") {
          notificationTitle = "Complaint Accepted";
          notificationMsg = `Your complaint "${comp.title}" has been accepted by workshop.`;
        } else if (status === "Repair Started") {
          notificationTitle = "Repair Started";
          notificationMsg = `Work has begun on your vehicle in the bay.`;
        } else if (status === "Completed") {
          notificationTitle = "Repair Completed";
          notificationMsg = `Your vehicle is ready! Please review invoice logs.`;
        }

        await Notification.create({
          user_id: comp.owner_id.toString(),
          title: notificationTitle,
          message: notificationMsg,
          type: "success"
        });
      }
    }

    if (technician_notes !== undefined) comp.technician_notes = technician_notes;
    if (estimated_cost !== undefined) comp.estimated_cost = estimated_cost;
    if (estimated_completion !== undefined) comp.estimated_completion = estimated_completion;
    if (assigned_mechanic_id !== undefined) comp.assigned_mechanic_id = assigned_mechanic_id;
    if (repair_image) {
      comp.repair_images.push(repair_image);
    }

    comp.updated_at = new Date();
    await comp.save();

    let emailStatus = "Skipped";
    if (status && status !== oldStatus) {
      emailStatus = await triggerStatusNotification(id, status, status === "Cancelled" ? technician_notes : undefined);
    }

    // Return fully populated document
    const updated = await Complaint.findById(id)
      .populate("owner_id", "name email phone profile_image")
      .populate("vehicle_id")
      .populate("workshop_id", "name email phone profile_image");

    const updatedObj = updated ? updated.toObject() : {};
    return NextResponse.json({ ...updatedObj, emailStatus });
  } catch (err: any) {
    console.error("Complaint PATCH detail error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
