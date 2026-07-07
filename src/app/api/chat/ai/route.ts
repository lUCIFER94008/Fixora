import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Message } from "@/models/Schemas";
import { verifyUser } from "@/lib/jwt";

// Keyword-based AI diagnostic response engine
function generateAIResponse(userMessage: string, context?: any): string {
  const msg = userMessage.toLowerCase();
  
  const diagnoses: [string[], string][] = [
    [["brake", "squeal", "grinding", "stop", "slow"], 
     "⚠️ **Brake Diagnosis**: Squealing or grinding brakes indicate worn brake pads or warped rotors. Immediate inspection recommended. Estimate: ₹1,500–₹4,500. Priority: HIGH."],
    [["engine", "overheat", "hot", "temperature", "steam", "boil"],
     "🌡️ **Thermal Overload Detected**: Engine overheating can stem from coolant leaks, a faulty thermostat, or a damaged radiator. Do NOT continue driving. Estimate: ₹2,000–₹8,000. Priority: URGENT."],
    [["battery", "dead", "start", "crank", "click", "ignition"],
     "🔋 **Battery / Ignition Fault**: Battery failure or starter motor issues are likely. Jump-start attempt recommended. Battery replacement: ₹2,500–₹5,000. Starter motor: ₹3,000–₹7,000."],
    [["oil", "leak", "smoke", "burning", "smell"],
     "🛢️ **Oil System Alert**: Oil leaks or burning oil smell indicates gasket failure or worn seals. Address immediately to prevent engine damage. Estimate: ₹1,000–₹6,000."],
    [["tyre", "tire", "flat", "puncture", "alignment", "vibrate"],
     "🔧 **Tyre & Alignment Issue**: Vibration or pull during driving indicates wheel misalignment or tyre imbalance. Alignment check: ₹500–₹1,500. Tyre replacement: ₹2,000–₹4,000/tyre."],
    [["ac", "air", "cool", "cold", "heat", "hvac", "climate"],
     "❄️ **HVAC System Fault**: AC issues typically involve refrigerant loss, compressor failure, or clogged filters. Recharge: ₹1,500–₹3,000. Compressor: ₹5,000–₹15,000."],
    [["transmission", "gear", "shift", "slip", "clutch"],
     "⚙️ **Transmission Alert**: Gear slipping or rough shifting points to transmission fluid degradation or clutch plate wear. Fluid flush: ₹1,500. Clutch replacement: ₹6,000–₹12,000."],
    [["electric", "ev", "battery percentage", "range", "charging"],
     "⚡ **EV Diagnostics**: For electric vehicles, reduced range typically indicates cell degradation. Battery health check recommended. Module calibration: ₹2,000–₹5,000."],
    [["noise", "rattle", "clunk", "knock", "squeak"],
     "🔍 **Chassis / Suspension Noise**: Rattling or knocking sounds often originate from worn bushings, loose heat shields, or suspension components. Inspection: ₹500. Repair: ₹1,000–₹8,000."],
    [["fuel", "mileage", "consumption", "economy", "efficiency"],
     "⛽ **Fuel Efficiency Drop**: Decreased mileage may indicate dirty air filters, injector fouling, or oxygen sensor failure. Air filter: ₹300–₹800. Injector cleaning: ₹1,500–₹3,000."],
  ];

  for (const [keywords, response] of diagnoses) {
    if (keywords.some(kw => msg.includes(kw))) {
      const suffix = context?.vehicles?.length 
        ? `\n\n📋 Your registered vehicles (${context.vehicles.map((v: any) => `${v.make} ${v.model}`).join(", ")}) are on record. I can help file a complaint directly to a workshop.` 
        : "\n\n💡 Register & login to file a direct complaint, track repair status, and receive personalized diagnostics.";
      return response + suffix;
    }
  }

  if (context?.name) {
    return `Hello ${context.name}! 👋 I'm Fixora's AI Diagnostic Engine. Describe your vehicle's symptoms and I'll provide an instant analysis. You can also view your ${context.complaints?.length || 0} complaint(s) from your dashboard.`;
  }

  return "🤖 **Fixora Neural Core Active** — Please describe your vehicle issue in detail. Examples: *\"My brakes are making a grinding noise\"*, *\"Engine is overheating\"*, *\"Car won't start\"*. I'll analyze and recommend a service action.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, sessionId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ detail: "Message is required" }, { status: 400 });
    }

    // Try to get auth context for personalized responses (optional for guest)
    let userContext: any = null;
    let tokenUser: any = null;
    try {
      await connectToDatabase();
      tokenUser = await verifyUser(req);
      if (tokenUser) {
        userContext = {
          name: tokenUser.name,
          vehicles: tokenUser.vehicles || [],
          complaints: tokenUser.complaints || []
        };
      }
    } catch (_) {}

    // Simulate neural processing delay
    const aiReply = generateAIResponse(message, userContext);

    // Save to MongoDB if authenticated
    if (tokenUser) {
      try {
        await Message.create({
          senderId: tokenUser._id,
          receiverId: "ai",
          senderRole: tokenUser.role || "owner",
          message,
          messageType: "text",
          isSeen: true,
          complaintId: sessionId || undefined
        });
        await Message.create({
          senderId: "ai",
          receiverId: tokenUser._id,
          senderRole: "ai",
          message: aiReply,
          messageType: "text",
          isSeen: false,
          complaintId: sessionId || undefined
        });
      } catch (_) {}
    }

    return NextResponse.json({
      reply: aiReply,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("AI chat error:", err);
    return NextResponse.json({
      reply: "🔌 Neural core temporarily offline. Please try again shortly.",
      timestamp: new Date().toISOString()
    });
  }
}
