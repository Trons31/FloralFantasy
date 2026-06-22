import sharp from "sharp";

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 82;

export async function optimizeImageFileToDataUrl(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
  } = {}
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
    const quality = options.quality ?? DEFAULT_QUALITY;
    const optimizedBuffer = await sharp(buffer, { failOnError: false })
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    return `data:image/webp;base64,${optimizedBuffer.toString("base64")}`;
  } catch {
    return `data:${file.type || "image/*"};base64,${buffer.toString("base64")}`;
  }
}
