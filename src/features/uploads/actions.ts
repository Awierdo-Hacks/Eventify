'use server';

import { fail, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { rateLimit, TOO_MANY_REQUESTS } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/session';
import { storeUpload, UploadError, type UploadFolder } from '@/lib/storage';

export interface UploadedFile {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * Upload one file. Always requires a signed-in user (v1 accepted anonymous
 * uploads); the file type is decided from its content, not its name.
 */
export async function uploadFileAction(formData: FormData): Promise<ActionResult<UploadedFile>> {
  const user = await getCurrentUser();
  if (!user) return fail('Je bent niet meer ingelogd. Log opnieuw in.');

  const folder = formData.get('folder') === 'chat' ? 'chat' : ('providers' satisfies UploadFolder);
  if (folder === 'providers' && user.role !== 'PROVIDER' && user.role !== 'ADMIN') {
    return fail('Alleen dienstverleners kunnen profielfoto’s uploaden.');
  }
  if (!rateLimit(`upload:${user.id}`, 40, 10 * 60_000).allowed) return fail(TOO_MANY_REQUESTS);

  const file = formData.get('file');
  if (!(file instanceof File)) return fail('Geen bestand ontvangen.');

  try {
    const stored = await storeUpload(file, folder);
    return ok({
      url: stored.url,
      fileName: file.name.replace(/[^\w.\- ()]/g, '_').slice(0, 120) || 'bestand',
      fileType: stored.mime,
      fileSize: stored.size,
    });
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message);
    console.error('[uploads] upload failed', error);
    return fail(GENERIC_ERROR);
  }
}
