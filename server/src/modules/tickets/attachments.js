import { randomUUID } from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { deleteObject, getObjectStream, isStorageEnabled, putObject } from '../../storage/s3.js';
import { ApiError } from '../../utils/api-error.js';

export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: MAX_ATTACHMENTS },
});

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const FILE_TYPES = [
  { mimeType: 'image/jpeg', extension: 'jpg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mimeType: 'image/png', extension: 'png', matches: (b) => b.subarray(0, 8).equals(PNG_SIGNATURE) },
  { mimeType: 'image/webp', extension: 'webp', matches: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  { mimeType: 'application/pdf', extension: 'pdf', matches: (b) => b.toString('ascii', 0, 5) === '%PDF-' },
];

export function detectFileType(buffer) {
  const type = FILE_TYPES.find((candidate) => candidate.matches(buffer));
  return type ? { mimeType: type.mimeType, extension: type.extension } : null;
}

const uploadsUnavailable = (message) => new ApiError(503, 'UPLOADS_UNAVAILABLE', message);

function safeFilename(name) {
  const cleaned = path.basename(name).replace(/[^\w.\- ]+/g, '_').trim();
  return (cleaned || 'attachment').slice(0, 120);
}

function objectKey(extension) {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `attachments/${now.getUTCFullYear()}/${month}/${randomUUID()}.${extension}`;
}


export async function storeAttachments(files, uploadedBy) {
  if (files.length === 0) return [];
  if (!isStorageEnabled()) {
    throw uploadsUnavailable('File attachments are not available right now. Please submit your query without attachments.');
  }

  const typed = files.map((file) => {
    const type = detectFileType(file.buffer);
    if (!type) {
      throw new ApiError(400, 'UNSUPPORTED_FILE', `"${file.originalname}" isn't a supported file. Please attach JPG, PNG, WebP or PDF files.`);
    }
    return { file, type };
  });

  const stored = [];
  try {
    for (const { file, type } of typed) {
      const key = objectKey(type.extension);
      await putObject(key, file.buffer, type.mimeType, { 'uploaded-by': uploadedBy });
      stored.push({ key, filename: safeFilename(file.originalname), mimeType: type.mimeType, size: file.size });
    }
  } catch (error) {
    console.error('[storage] attachment upload failed', error);
    await deleteAttachments(stored);
    throw uploadsUnavailable("We couldn't save your attachment right now. Please try again, or submit without it.");
  }
  return stored;
}

export async function deleteAttachments(attachments) {
  await Promise.allSettled(attachments.map((attachment) => deleteObject(attachment.key)));
}

export async function openAttachmentStream(attachment) {
  if (!isStorageEnabled()) throw uploadsUnavailable('Attachments are not available right now.');
  try {
    return await getObjectStream(attachment.key);
  } catch (error) {
    if (error.name === 'NoSuchKey') throw ApiError.notFound('Attachment not found.');
    console.error('[storage] attachment download failed', error);
    throw uploadsUnavailable('This attachment is not available right now. Please try again later.');
  }
}
