import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadSchema = z.object({
  organizationId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const organizationId = formData.get('organizationId') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate input
  const parsed = uploadSchema.safeParse({ organizationId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}. Allowed: jpg, png, webp, pdf, docx` },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
  }

  // Verify org membership
  const membership = await db.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: parsed.data.organizationId,
      },
    },
  });

  if (!membership && session.user.globalRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
  }

  // Upload to Vercel Blob
  const blob = await put(file.name, file, { access: 'public' });

  // Create upload record
  const upload = await db.upload.create({
    data: {
      fileName: file.name,
      fileUrl: blob.url,
      fileSize: file.size,
      mimeType: file.type,
      uploadedById: session.user.id,
      organizationId: parsed.data.organizationId,
    },
  });

  return NextResponse.json(upload);
}
