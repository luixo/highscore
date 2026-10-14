import * as aws from "@aws-sdk/client-s3";
import { env } from "./env";

export const S3_IMAGES_PREFIX = "images";

type S3Client = {
	putObject: (key: string, object: Buffer) => Promise<void>;
	bucket: string;
	endpoint: string;
};

export const getS3Client = (): S3Client => {
	const { S3_ACCESS_KEY_ID, S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_SECRET_KEY } =
		env;
	const client = new aws.S3Client({
		credentials: {
			accessKeyId: S3_ACCESS_KEY_ID,
			secretAccessKey: S3_SECRET_KEY,
		},
		endpoint: S3_ENDPOINT,
		region: S3_REGION,
	});
	return {
		bucket: S3_BUCKET,
		endpoint: S3_ENDPOINT,
		putObject: async (key, object) => {
			const command = new aws.PutObjectCommand({
				Body: object,
				Bucket: S3_BUCKET,
				CacheControl: "max-age=86400",
				Key: key,
			});
			await client.send(command);
		},
	};
};
