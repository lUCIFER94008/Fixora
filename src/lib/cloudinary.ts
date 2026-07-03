import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "mock_cloud",
  api_key: process.env.CLOUDINARY_API_KEY || "mock_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mock_secret",
});

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads a base64 string or file buffer to Cloudinary
 * @param fileStr Base64 encoded file string or data URI
 * @param folder Folder name in Cloudinary (e.g. 'profiles', 'complaints', 'vehicles', 'workshops')
 */
export async function uploadToCloudinary(
  fileStr: string,
  folder: "profiles" | "complaints" | "vehicles" | "workshops"
): Promise<CloudinaryUploadResult> {
  // If keys are not configured, simulate upload
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME === "mock_cloud"
  ) {
    console.log(`[CLOUDINARY-SIMULATOR] Simulating asset upload to folder: ${folder}`);
    const mockUrls = {
      profiles: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
      complaints: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600",
      vehicles: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600",
      workshops: "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png",
    };
    return {
      secure_url: mockUrls[folder] || mockUrls.profiles,
      public_id: `mock_public_id_${Date.now()}`,
    };
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: `fixora/${folder}`,
      resource_type: "auto",
    });
    return {
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload failure:", error);
    throw error;
  }
}
