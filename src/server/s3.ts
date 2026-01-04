import * as aws from "@aws-sdk/client-s3";

export const S3_IMAGES_PREFIX = "images";

const getS3Parts = () => {
  const s3Bucket = process.env.S3_BUCKET;
  if (!s3Bucket) {
    throw new Error("Expected to have process.env.S3_BUCKET variable!");
  }
  const s3Endpoint = process.env.S3_ENDPOINT;
  if (!s3Endpoint) {
    throw new Error("Expected to have process.env.S3_ENDPOINT variable!");
  }
  const s3Region = process.env.S3_REGION;
  if (!s3Region) {
    throw new Error("Expected to have process.env.S3_REGION variable!");
  }
  const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
  if (!s3AccessKeyId) {
    throw new Error("Expected to have process.env.S3_ACCESS_KEY_ID variable!");
  }
  const s3SecretKey = process.env.S3_SECRET_KEY;
  if (!s3SecretKey) {
    throw new Error("Expected to have process.env.S3_SECRET_KEY variable!");
  }
  return { s3Endpoint, s3Bucket, s3Region, s3AccessKeyId, s3SecretKey };
};

type S3Client = {
  putObject: (key: string, object: Buffer) => Promise<void>;
  bucket: string;
  endpoint: string;
};

export const getS3Client = (): S3Client => {
  const { s3Endpoint, s3Bucket, s3Region, s3AccessKeyId, s3SecretKey } =
    getS3Parts();
  const client = new aws.S3Client({
    endpoint: s3Endpoint,
    region: s3Region,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretKey,
    },
  });
  return {
    putObject: async (key, object) => {
      const command = new aws.PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: object,
        CacheControl: "max-age=86400",
      });
      await client.send(command);
    },
    bucket: s3Bucket,
    endpoint: s3Endpoint,
  };
};
