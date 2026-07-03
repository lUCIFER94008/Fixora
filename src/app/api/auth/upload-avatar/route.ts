import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Read multiform file stream if available
    const formData = await req.formData().catch(() => null);
    const file = formData ? formData.get("file") : null;
    
    // Cloudinary upload simulation (fallback url)
    const mockCloudinaryUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250";
    
    console.log("[CLOUDINARY-MOCK] Uploading file asset to Cloudinary CDN server...");
    
    return NextResponse.json({ url: mockCloudinaryUrl });
  } catch (err: any) {
    console.error("Avatar upload error:", err);
    return NextResponse.json({ detail: "Server upload failure" }, { status: 500 });
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
