import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} não configurado. Storage de arquivos exige as variáveis S3_* (ver .env.example).`,
    );
  }
  return value;
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    endpoint: readEnv("S3_ENDPOINT"),
    region: process.env.S3_REGION || "auto",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: readEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: readEnv("S3_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

function getBucket(): string {
  return readEnv("S3_BUCKET");
}

export async function uploadObject(objectKey: string, body: Buffer, contentType: string) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getSignedDownloadUrl(objectKey: string, expiresInSeconds = 300) {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: objectKey });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
}

export async function deleteObject(objectKey: string) {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: objectKey }));
}
