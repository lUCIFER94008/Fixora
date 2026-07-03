import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "mock_cloud",
  api_key: process.env.CLOUDINARY_API_KEY || "mock_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mock_secret",
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { file, folder, resource_type } = body;

    if (!file) {
      return NextResponse.json({ detail: "Missing file parameter. Base64 or DataURI required." }, { status: 400 });
    }

    // Mock upload if Cloudinary is not configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "mock_cloud") {
      console.log(`[CLOUDINARY-SIMULATOR] Uploading asset of type ${resource_type || "image"} to folder: ${folder || "general"}`);
      const mockUrls: any = {
        profiles: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
        complaints: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600",
        vehicles: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600",
        workshops: "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"
      };
      return NextResponse.json({
        secure_url: mockUrls[folder] || mockUrls.profiles,
        public_id: `mock_public_id_${Date.now()}`
      });
    }

    // Upload to Cloudinary with compression & optimizations
    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: `fixora/${folder || "general"}`,
      resource_type: resource_type || "auto",
      transformation: [
        { quality: "auto:good" }, // Compresses large images
        { fetch_format: "auto" }  // Serves WebP/AVIF if supported
      ]
    });

    return NextResponse.json({
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id
    });
  } catch (err: any) {
    console.error("Cloudinary upload API error:", err);
    return NextResponse.json({ detail: "Asset upload pipeline error." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const public_id = searchParams.get("public_id");

    if (!public_id) {
      return NextResponse.json({ detail: "Missing public_id parameter" }, { status: 400 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "mock_cloud") {
      console.log(`[CLOUDINARY-SIMULATOR] Deleted asset: ${public_id}`);
      return NextResponse.json({ result: "ok" });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Cloudinary delete API error:", err);
    return NextResponse.json({ detail: "Failed to delete asset" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
