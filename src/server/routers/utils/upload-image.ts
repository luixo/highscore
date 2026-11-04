import { v4 } from "uuid";
import { zfd } from "zod-form-data";
import { validateImage } from "~/server/image";
import { publicProcedure } from "~/server/router";
import { getImageKey, getImageUrl, getS3Client } from "~/server/s3";

export const procedure = publicProcedure
	.input(zfd.formData({ image: zfd.file() }))
	.mutation(async ({ input: { image } }) => {
		const s3Client = getS3Client();
		const validatedImage = await validateImage(
			Buffer.from(await image.arrayBuffer()),
		);
		const id = v4();
		await s3Client.putObject(getImageKey(id), validatedImage);
		return { id, url: getImageUrl(id) };
	});
