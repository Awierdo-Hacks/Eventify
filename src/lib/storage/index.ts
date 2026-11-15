import 'server-only';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/lib/env';

/**
 * File storage. Uploads go to object storage when a Vercel Blob token is
 * configured, otherwise to `public/uploads` on local disk (development,
 * Docker, or hosts with a persistent disk). URLs written by v1
 * (`/uploads/...`) keep working because that folder is still served.
 */

export type UploadFolder = 'providers' | 'chat';

interface FileKind {
  mime: string;
  extension: string;
}

const MB = 1024 * 1024;
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const UPLOAD_RULES: Record<UploadFolder, { maxBytes: number; mimes: string[]; description: string }> = {
  providers: { maxBytes: 5 * MB, mimes: IMAGE_MIMES, description: 'JPG, PNG, WebP of GIF, maximaal 5 MB' },
  chat: { maxBytes: 10 * MB, mimes: [...IMAGE_MIMES, 'application/pdf'], description: 'Afbeelding of PDF, maximaal 10 MB' },
};

/**
 * Identify a file from its first bytes. The browser-supplied MIME type and
 * file name are never trusted (v1 accepted SVG, which can carry scripts).
 */
export function sniffFileKind(bytes: Uint8Array): FileKind | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', extension: 'jpg' };
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', extension: 'png' };
  if (startsWith([0x47, 0x49, 0x46, 0x38])) return { mime: 'image/gif', extension: 'gif' };
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: 'image/webp', extension: 'webp' };
  }
  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return { mime: 'application/pdf', extension: 'pdf' };
  return null;
}

export class UploadError extends Error {}

export interface StoredFile {
  url: string;
  mime: string;
  size: number;
}

export async function storeUpload(file: File, folder: UploadFolder): Promise<StoredFile> {
  const rules = UPLOAD_RULES[folder];
  if (file.size === 0) throw new UploadError('Het bestand is leeg.');
  if (file.size > rules.maxBytes) throw new UploadError(`Het bestand is te groot. ${rules.description}.`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffFileKind(bytes);
  if (!kind || !rules.mimes.includes(kind.mime)) {
    throw new UploadError(`Dit bestandstype wordt niet ondersteund. ${rules.description}.`);
  }

  const name = `${Date.now()}-${randomBytes(8).toString('hex')}.${kind.extension}`;

  if (env.blobToken) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`${folder}/${name}`, Buffer.from(bytes), {
      access: 'public',
      contentType: kind.mime,
      token: env.blobToken,
    });
    return { url: blob.url, mime: kind.mime, size: file.size };
  }

  const directory = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  return { url: `/uploads/${folder}/${name}`, mime: kind.mime, size: file.size };
}

/** Best-effort removal of a previously stored file (used on account erasure). */
export async function deleteUpload(url: string): Promise<void> {
  try {
    if (url.startsWith('/uploads/')) {
      const relative = path.normalize(url).replace(/^[/\\]+/, '');
      if (!relative.startsWith('uploads')) return;
      await unlink(path.join(process.cwd(), 'public', relative));
    } else if (env.blobToken && url.includes('.blob.vercel-storage.com')) {
      const { del } = await import('@vercel/blob');
      await del(url, { token: env.blobToken });
    }
  } catch {
    // The file may already be gone; nothing else depends on this.
  }
}

/** URLs we are willing to store as an image reference. */
export function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith('/uploads/')) return !url.includes('..');
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}
