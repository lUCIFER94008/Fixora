import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Complaint, User } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    let list: any[] = [];
    if (tokenUser.role === "owner") {
      list = await Complaint.find({ owner_id: tokenUser._id }).sort({ created_at: -1 });
    } else if (tokenUser.role === "workshop") {
      // Find complaints assigned to this workshop owner's user id
      list = await Complaint.find({ workshop_id: tokenUser._id }).sort({ created_at: -1 });
    } else if (tokenUser.role === "admin") {
      list = await Complaint.find({}).sort({ created_at: -1 });
    }

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("Complaints GET error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { vehicle_id, title, description, priority, workshop_id, voice_url, image_url } = await req.json();

    if (!vehicle_id || !title || !description) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }

    // AI Diagnostics Simulation matching description keywords
    const descLower = description.toLowerCase();
    let category = "General";
    let detected_faults = ["Unspecified Diagnostic Code"];
    let severity = "Medium";
    let recommended_action = "Schedule workshop inspection.";
    let minCost = 500;
    let maxCost = 1500;
    let estimated_time = "1 day";

    if (descLower.includes("brake") || descLower.includes("squeal") || descLower.includes("rotor")) {
      category = "Brakes";
      detected_faults = ["Front Brake Rotor Warp", "Friction Pad Thinning"];
      severity = "Medium";
      recommended_action = "Replace brake rotor set and pad calipers.";
      minCost = 800;
      maxCost = 1600;
      estimated_time = "4 hours";
    } else if (descLower.includes("whine") || descLower.includes("noise") || descLower.includes("gear") || descLower.includes("drivetrain")) {
      category = "Engine";
      detected_faults = ["Drive Bearing Wear", "Differential Gearing Misalignment"];
      severity = "High";
      recommended_action = "EV motor dismantling & drivetrain bearing replace.";
      minCost = 3500;
      maxCost = 5000;
      estimated_time = "3 days";
    } else if (descLower.includes("battery") || descLower.includes("charge") || descLower.includes("range")) {
      category = "Electrical";
      detected_faults = ["Battery Cell Voltage Anomaly", "Thermal Sensor Failure"];
      severity = "Critical";
      recommended_action = "Perform battery module recalibration and swap cell group 3.";
      minCost = 4500;
      maxCost = 7000;
      estimated_time = "5 days";
    }

    const ai_diagnostics = {
      category,
      detected_faults,
      severity,
      recommended_action,
      estimated_cost_range: { min: minCost, max: maxCost },
      estimated_time,
      confidence_score: 0.94
    };

    const newComplaint = await Complaint.create({
      owner_id: tokenUser._id,
      vehicle_id,
      title,
      description,
      priority: priority || "Normal",
      status: "Pending",
      workshop_id: workshop_id ? workshop_id : undefined,
      voice_url: voice_url || undefined,
      image_url: image_url || undefined,
      repair_images: [],
      ai_diagnostics,
      estimated_cost: minCost + 200,
      estimated_completion: estimated_time
    });

    return NextResponse.json(newComplaint);
  } catch (err: any) {
    console.error("Complaints POST error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
