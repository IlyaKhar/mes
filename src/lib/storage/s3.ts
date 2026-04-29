import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_REGION;

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!bucket || !region) {
    throw new Error("S3 не настроен: нужны AWS_S3_BUCKET и AWS_REGION");
  }

  s3Client ??= new S3Client({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          }
        : undefined
  });

  return s3Client;
}

export async function uploadToS3(input: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType
    })
  );

  return `https://${bucket}.s3.${region}.amazonaws.com/${input.key}`;
}
