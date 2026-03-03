import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Geen bestand gevonden' },
        { status: 400 }
      );
    }

    // Valideer bestandstype
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Alleen JPG, PNG en WebP bestanden zijn toegestaan' },
        { status: 400 }
      );
    }

    // Valideer bestandsgrootte (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Bestand mag maximaal 5MB zijn' },
        { status: 400 }
      );
    }

    // Maak uploads directory aan
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'providers');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Genereer unieke bestandsnaam
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Schrijf bestand
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const url = `/uploads/providers/${fileName}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het uploaden' },
      { status: 500 }
    );
  }
}
