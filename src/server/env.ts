import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url(),
	NODE_ENV: z.enum(["development", "test", "production"]),
	PORT: z.coerce.number().catch(() => 3000),
	PUSHER_APP_ID: z.string(),
	PUSHER_SECRET: z.string(),
	S3_ACCESS_KEY_ID: z.string(),
	S3_BUCKET: z.string(),
	S3_ENDPOINT: z.url(),
	S3_REGION: z.string(),
	S3_SECRET_KEY: z.string(),
	VITE_PUSHER_APP_KEY: z.string(),
	VITE_PUSHER_HOST: z.string(),
});

// This is the only place it's allowed
// oxlint-disable-next-line node/no-process-env
const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
	throw new Error(
		`❌ Invalid environment variables: ${JSON.stringify(
			z.treeifyError(envParsed.error),
			null,
			4,
		)}`,
	);
}
export const env = envParsed.data;
