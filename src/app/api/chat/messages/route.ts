import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ChatMessage, User } from "@/models/Schemas";
import { verifyToken } from "@/lib/jwt";
import { sendChatReplyOfflineEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = verifyToken(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { receiver_id, content, complaint_id } = await req.json();

    if (!receiver_id || !content) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }

    // AI bot automatic response simulation
    let ai_replies: string[] = [];
    if (receiver_id === "ai_bot") {
      const contentLower = content.toLowerCase();
      let replyContent = "I've registered your vehicle telemetry diagnostics. Please connect with our workshop list to schedule an inspection.";
      if (contentLower.includes("brake")) {
        replyContent = "Squealing brakes are generally caused by worn friction pads. I recommend scheduling an inspection at NEON HYPERGARAGE.";
      } else if (contentLower.includes("whine") || contentLower.includes("noise")) {
        replyContent = "Rear motor high frequency noise is identified as differential gear bearing wear. Please contact Mike Miller at NEON HYPERGARAGE.";
      }

      const msg = await ChatMessage.create({
        sender_id: "ai_bot",
        receiver_id: tokenUser._id.toString(),
        content: replyContent,
        seen: true,
        complaint_id,
        ai_replies: []
      });
      return NextResponse.json(msg);
    }

    // Standard driver-to-workshop communication
    if (tokenUser.role === "owner") {
      ai_replies = [
        "Sounds like a good plan.",
        "We are currently reviewing the gears.",
        "We have the replacement in stock."
      ];
    }

    const newMsg = await ChatMessage.create({
      sender_id: tokenUser._id.toString(),
      receiver_id: receiver_id.toString(),
      content,
      seen: false,
      complaint_id,
      ai_replies
    });

    if (tokenUser.role === "workshop") {
      const receiver = await User.findById(receiver_id);
      if (receiver && receiver.email) {
        await sendChatReplyOfflineEmail(receiver.email, receiver.name, content);
      }
    }

    return NextResponse.json(newMsg);
  } catch (err: any) {
    console.error("Chat messages POST error:", err);
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
