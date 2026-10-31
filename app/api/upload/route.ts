import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { detectFileType, storeFile } from '@/lib/storage';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Provider registration uploads portfolio photos before the account
    // exists, so anonymous uploads are allowed but limited much harder.
    const session = await getSession();
    const allowed = session
      ? await checkRateLimit(`upload:user:${session.id}`, 30, 10 * 60_000)
      : await checkRateLimit(`upload:ip:${getClientIp(request)}`, 10, 10 * 60_000);
    if (!allowed) return rateLimitResponse();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Geen bestand gevonden' },
        { status: 400 }
      );
    }

    // Valideer bestandsgrootte (max 5MB)
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Bestand mag maximaal 5MB zijn' },
        { status: 400 }
      );
    }

    // Valideer het echte bestandstype op basis van de inhoud
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = detectFileType(buffer, ['image']);
    if (!type) {
      return NextResponse.json(
        { error: 'Alleen JPG, PNG en WebP bestanden zijn toegestaan' },
        { status: 400 }
      );
    }

    const url = await storeFile('providers', buffer, type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het uploaden' },
      { status: 500 }
    );
  }
}
