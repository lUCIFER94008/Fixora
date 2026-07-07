import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const list = await Notification.find({ user_id: tokenUser._id })
      .sort({ created_at: -1 })
      .limit(30);

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("Notifications GET error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { id, readAll } = await req.json();

    if (readAll) {
      await Notification.updateMany(
        { user_id: tokenUser._id, read: false },
        { $set: { read: true } }
      );
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ detail: "Missing notification id" }, { status: 400 });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: id, user_id: tokenUser._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notif) {
      return NextResponse.json({ detail: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json(notif);
  } catch (err: any) {
    console.error("Notifications PATCH error:", err);
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
