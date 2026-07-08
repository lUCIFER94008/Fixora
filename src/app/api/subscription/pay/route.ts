import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const tokenUser = await verifyUser(req);
    if (!tokenUser) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    // Razorpay checkout simulation
    // We expect the payment parameters or a mock checkout confirmation
    const paymentId = razorpay_payment_id || `pay_mock_${crypto.randomBytes(8).toString("hex")}`;
    const orderId = razorpay_order_id || `order_mock_${crypto.randomBytes(8).toString("hex")}`;
    const signature = razorpay_signature || `sig_mock_${crypto.randomBytes(16).toString("hex")}`;

    // Perform User Subscription Upgrade
    await User.findByIdAndUpdate(tokenUser._id, {
      plan: "PREMIUM",
      vehicleLimit: 99999, // Unlimited indicator
      paymentStatus: "PAID",
      paymentId: paymentId,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    });

    console.log(`[SUBSCRIPTION-UPGRADE] User ${tokenUser.email} upgraded to PREMIUM. Payment ID: ${paymentId}`);

    return NextResponse.json({
      success: true,
      message: "Subscription successfully upgraded to Premium.",
      subscription: {
        plan: "PREMIUM",
        vehicleLimit: "Unlimited",
        paymentStatus: "PAID",
        paymentId,
        orderId,
        signature,
        date: new Date()
      }
    });
  } catch (err: any) {
    console.error("Subscription payment error:", err);
    return NextResponse.json({ detail: "Server error during subscription upgrade." }, { status: 500 });
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
