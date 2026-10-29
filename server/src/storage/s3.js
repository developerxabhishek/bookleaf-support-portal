import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';


const client = env.S3_BUCKET
  ? new S3Client({
      region: env.S3_REGION,
      ...(env.S3_ENDPOINT
        ? {
            endpoint: env.S3_ENDPOINT,
            forcePathStyle: true,
            // S3-compatible services (Backblaze B2, R2, MinIO) don't all accept the SDK's newer default checksum headers.
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
          }
        : {}),
    })
  : null;

export function isStorageEnabled() {
  return client !== null;
}

export async function putObject(key, body, contentType, metadata = {}) {
  await client.send(
    new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: contentType, Metadata: metadata }),
  );
}

export async function getObjectStream(key) {
  const { Body } = await client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return Body;
}

export async function deleteObject(key) {
  await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}
