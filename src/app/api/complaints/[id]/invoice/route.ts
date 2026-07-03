import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Invoice } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";

export async function GET(
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
    const inv = await Invoice.findOne({ complaint_id: id });
    if (!inv) {
      return NextResponse.json({ detail: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(inv);
  } catch (err: any) {
    console.error("Complaint invoice GET error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

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
    const { items, discount } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ detail: "Items list is required" }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.cost), 0);
    const tax = subtotal * 0.05;
    const finalDiscount = Number(discount) || 0;
    const total = subtotal + tax - finalDiscount;

    // Check if invoice already exists
    let inv = await Invoice.findOne({ complaint_id: id });
    if (inv) {
      inv.items = items;
      inv.subtotal = subtotal;
      inv.tax = tax;
      inv.discount = finalDiscount;
      inv.total = total;
      await inv.save();
    } else {
      inv = await Invoice.create({
        complaint_id: id,
        workshop_id: tokenUser._id, // Workshop owner id
        owner_id: "owner_id", // Fallback owner reference
        items,
        subtotal,
        tax,
        discount: finalDiscount,
        total,
        status: "Unpaid"
      });
    }

    return NextResponse.json(inv);
  } catch (err: any) {
    console.error("Complaint invoice POST error:", err);
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
