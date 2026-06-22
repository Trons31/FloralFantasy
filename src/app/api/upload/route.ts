import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { optimizeImageFileToDataUrl } from "@/lib/image-optimization";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const folder = String(formData.get("folder") || "gardentech").trim() || "gardentech";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo debe ser una imagen válida" }, { status: 400 });
  }
  const result = await uploadImage(await optimizeImageFileToDataUrl(file), {
    folder,
    transformation: [],
  });
  return NextResponse.json(result);
}
