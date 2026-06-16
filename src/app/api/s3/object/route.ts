import { NextRequest, NextResponse } from 'next/server';
import { getS3ObjectBytes } from '@/lib/utils/s3-utils';
import { getCurrentUserId } from '@/lib/utils/auth-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getFileName = (key: string): string => {
  const lastSegment = key.split('/').filter(Boolean).pop() || 's3-object';
  return lastSegment.replace(/["\r\n]/g, '_');
};

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const bucket = searchParams.get('bucket') || undefined;

  if (!key) {
    return NextResponse.json({ error: 'Missing S3 object key' }, { status: 400 });
  }

  try {
    const object = await getS3ObjectBytes(key, bucket);
    const headers = new Headers({
      'Content-Type': object.contentType,
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': `inline; filename="${getFileName(key)}"`,
    });

    if (object.contentLength !== undefined) {
      headers.set('Content-Length', String(object.contentLength));
    }
    if (object.etag) {
      headers.set('ETag', object.etag);
    }
    if (object.lastModified) {
      headers.set('Last-Modified', object.lastModified.toUTCString());
    }

    return new NextResponse(object.body as any, { status: 200, headers });
  } catch (error: any) {
    console.error('[S3 Object API] Failed to read S3 object:', error);
    const status = error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404 ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? 'S3 object not found' : 'Failed to read S3 object' }, { status });
  }
}
