import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export type UploadKind = 'image' | 'pdf';

const SIGNATURES: { kind: UploadKind; ext: string; contentType: string; match: (b: Buffer) => boolean }[] = [
  { kind: 'image', ext: 'jpg', contentType: 'image/jpeg', match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    kind: 'image',
    ext: 'png',
    contentType: 'image/png',
    match: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    kind: 'image',
    ext: 'webp',
    contentType: 'image/webp',
    match: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  { kind: 'pdf', ext: 'pdf', contentType: 'application/pdf', match: (b) => b.subarray(0, 5).toString('ascii') === '%PDF-' },
];

/**
 * Detects the real file type from its first bytes (never trust the browser's
 * MIME type or file name). Returns null for anything not explicitly allowed.
 */
export function detectFileType(buffer: Buffer, allowed: UploadKind[]) {
  const signature = SIGNATURES.find((s) => allowed.includes(s.kind) && s.match(buffer));
  return signature ? { ext: signature.ext, contentType: signature.contentType } : null;
}

/**
 * Stores a validated file in Vercel Blob. Without BLOB_READ_WRITE_TOKEN (local
 * development) it falls back to public/uploads so the app keeps working.
 */
export async function storeFile(
  folder: 'providers' | 'chat',
  buffer: Buffer,
  type: { ext: string; contentType: string }
): Promise<string> {
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${type.ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${folder}/${fileName}`, buffer, {
      access: 'public',
      contentType: type.contentType,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set; uploads are not possible on Vercel without Blob storage');
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, fileName), buffer);
  return `/uploads/${folder}/${fileName}`;
}

/** True for URLs produced by storeFile (Blob store or local dev uploads). */
export function isOwnUploadUrl(url: string): boolean {
  if (url.startsWith('/uploads/')) return !url.includes('..');
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}
