import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { detectFileType, storeFile } from '@/lib/storage';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkRateLimit(`chat-upload:${session.id}`, 20, 10 * 60_000))) {
      return rateLimitResponse();
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 });
    }

    // Max 10MB for chat uploads
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Bestand mag maximaal 10MB zijn' },
        { status: 400 }
      );
    }

    // Allow images and PDF, detected from the file contents
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = detectFileType(buffer, ['image', 'pdf']);
    if (!type) {
      return NextResponse.json(
        { error: 'Alleen afbeeldingen (JPG, PNG, WebP) en PDF bestanden zijn toegestaan' },
        { status: 400 }
      );
    }

    const url = await storeFile('chat', buffer, type);

    return NextResponse.json({
      url,
      fileName: file.name.slice(0, 200),
      fileType: type.contentType,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Chat upload error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het uploaden' },
      { status: 500 }
    );
  }
}
