import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { requireAdminFromRequest } from '@/lib/require-admin-api';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  extensionForMime,
  maxBytesForMime,
} from '@/lib/upload-config';
import { ensureStorageBucket, getStorageBucketName, getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function saveLocalUpload(buffer: Buffer, ext: string, mime: string) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${randomUUID()}${ext}`;
  await writeFile(path.join(uploadsDir, filename), buffer);
  return {
    url: `/uploads/${filename}`,
    mime,
    size: buffer.length,
    bucket: 'local',
    path: `uploads/${filename}`,
  };
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin.ok) return admin.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
  }

  const mime = (file.type || '').toLowerCase().split(';')[0].trim();
  const allowed = ALLOWED_IMAGE_TYPES.has(mime) || ALLOWED_VIDEO_TYPES.has(mime);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Unsupported file type. Use JPEG, PNG, WebP, GIF, SVG, MP4, WebM, or MOV.' },
      { status: 400 },
    );
  }

  const maxBytes = maxBytesForMime(mime);
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large (max ${Math.round(maxBytes / (1024 * 1024))} MB for this type)` },
      { status: 400 },
    );
  }

  const ext = extensionForMime(mime);
  if (!ext) {
    return NextResponse.json({ error: 'Could not determine file extension' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdmin();

  // Prefer Supabase when configured; otherwise persist under /public/uploads for local/dev.
  if (!supabase) {
    try {
      const local = await saveLocalUpload(buffer, ext, mime);
      return NextResponse.json(local);
    } catch (error) {
      console.error('Local upload error:', error);
      return NextResponse.json(
        {
          error:
            'Storage is not configured and local upload failed. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or ensure the server can write to public/uploads.',
        },
        { status: 503 },
      );
    }
  }

  const bucket = getStorageBucketName();
  const objectPath = `cms/${randomUUID()}${ext}`;

  const uploadOpts = {
    contentType: mime,
    upsert: false,
    cacheControl: '3600',
  } as const;

  let { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, buffer, uploadOpts);

  if (uploadError) {
    const msg = uploadError.message || '';
    const isBucketMissing =
      /bucket not found/i.test(msg) || (uploadError as { statusCode?: string }).statusCode === '404';

    if (isBucketMissing) {
      const ensured = await ensureStorageBucket(supabase, bucket);
      if (!ensured.ok) {
        console.error('Supabase create bucket failed:', ensured.message);
        // Fall back to local disk so logo uploads still work.
        try {
          const local = await saveLocalUpload(buffer, ext, mime);
          return NextResponse.json({ ...local, warning: `Supabase bucket unavailable: ${ensured.message}` });
        } catch {
          return NextResponse.json(
            {
              error: `Could not create storage bucket "${bucket}": ${ensured.message}. Check the service role key and Storage permissions in Supabase.`,
              bucket,
            },
            { status: 502 },
          );
        }
      }
      const retry = await supabase.storage.from(bucket).upload(objectPath, buffer, uploadOpts);
      uploadError = retry.error;
    }
  }

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    try {
      const local = await saveLocalUpload(buffer, ext, mime);
      return NextResponse.json({
        ...local,
        warning: uploadError.message || 'Supabase upload failed; saved locally instead.',
      });
    } catch {
      return NextResponse.json(
        {
          error: uploadError.message || 'Upload to storage failed. Check bucket policies and file path.',
          bucket,
        },
        { status: 502 },
      );
    }
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  const url = publicData.publicUrl;

  return NextResponse.json({ url, mime, size: file.size, bucket, path: objectPath });
}
