import { TRPCError } from "@trpc/server";
import Sharp from "sharp";

const MAX_WIDTH = 1000;
const MAX_HEIGHT = 1000;
const MAX_BYTESIZE = 2 * 1024 * 1024;

const ALLOWED_FORMATS = new Set<keyof Sharp.FormatEnum>(["png", "jpeg", "jpg"]);

export const validateImage = async (image: Buffer) => {
  const parsedImage = Sharp(image);
  const metadata = await parsedImage.metadata();
  if (!metadata.size || metadata.size > MAX_BYTESIZE) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Maximum bytesize allowed is ${MAX_BYTESIZE}.`,
    });
  }
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      /* c8 ignore next */
      message: `Format "${metadata.format || "unknown"}" is not allowed.`,
    });
  }
  if (!metadata.width || metadata.width > MAX_WIDTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Maximum width allowed is ${MAX_WIDTH}px.`,
    });
  }
  if (!metadata.height || metadata.height > MAX_HEIGHT) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Maximum height allowed is ${MAX_HEIGHT}px.`,
    });
  }
  return parsedImage.toBuffer();
};
