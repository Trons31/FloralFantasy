import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  fileBase64: string,
  options: {
    folder?: string;
    transformation?: Record<string, any>[];
  } = {}
) {
  const result = await cloudinary.uploader.upload(fileBase64, {
    folder: options.folder || "fantasiaFloral",
    resource_type: "image",
    transformation: options.transformation || [
      { width: 1000, height: 1000, crop: "limit" },
      { quality: "auto:good" },
      { format: "webp" },
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
