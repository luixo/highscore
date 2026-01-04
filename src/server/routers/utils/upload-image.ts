import { v4 } from "uuid";
import { zfd } from "zod-form-data";

import { validateImage } from "~/server/image";
import { publicProcedure } from "~/server/router";
import { S3_IMAGES_PREFIX, getS3Client } from "~/server/s3";

export const procedure = publicProcedure
  .input(zfd.formData({ image: zfd.file() }))
  .mutation(async ({ input: { image } }) => {
    const s3Client = getS3Client();
    const validatedImage = await validateImage(
      Buffer.from(await image.arrayBuffer()),
    );
    const id = v4();
    const avatarKey = [S3_IMAGES_PREFIX, `${id}.png`].join("/");
    await s3Client.putObject(avatarKey, validatedImage);
    return { url: [s3Client.endpoint, s3Client.bucket, avatarKey].join("/") };
  });
