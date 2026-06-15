import { GetObjectCommand, S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Initialize S3 Client lazily to ensure environment variables are loaded
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Thiếu cấu hình thông tin kết nối AWS S3 (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).');
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

export interface S3ObjectBytes {
  body: Uint8Array;
  contentType: string;
  contentLength?: number;
  etag?: string;
  lastModified?: Date;
}

function getConfiguredBucketName(): string {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('Missing AWS_S3_BUCKET_NAME.');
  }
  return bucketName;
}

function getAllowedBucketName(bucketName?: string): string {
  const configuredBucketName = getConfiguredBucketName();
  if (bucketName && bucketName !== configuredBucketName) {
    throw new Error('S3 bucket is not allowed.');
  }
  return configuredBucketName;
}

export async function getS3ObjectBytes(key: string, bucketName?: string): Promise<S3ObjectBytes> {
  if (!key || key.includes('\0')) {
    throw new Error('Invalid S3 object key.');
  }

  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getAllowedBucketName(bucketName),
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error('S3 object body is empty.');
  }

  const body = response.Body as any;
  const bytes: Uint8Array = typeof body.transformToByteArray === 'function'
    ? await body.transformToByteArray()
    : new Uint8Array(await new Response(body).arrayBuffer());

  return {
    body: bytes,
    contentType: response.ContentType || 'application/octet-stream',
    contentLength: response.ContentLength,
    etag: response.ETag,
    lastModified: response.LastModified,
  };
}

/**
 * Upload buffer to S3 and return the public URL.
 */
export async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!bucketName || !region) {
    throw new Error('Thiếu cấu hình tên bucket hoặc region AWS S3 (AWS_S3_BUCKET_NAME, AWS_REGION).');
  }

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Download an image from Mathpix CDN and upload it to AWS S3.
 * Returns the new S3 URL.
 */
export async function downloadAndUploadToS3(url: string, prefix: string = 'mathpix-images'): Promise<string> {
  try {
    console.log(`[S3-Utils] Downloading image from Mathpix CDN: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Lỗi tải ảnh từ Mathpix CDN (status: ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Map content type to file extension
    let ext = 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      ext = 'jpg';
    } else if (contentType.includes('gif')) {
      ext = 'gif';
    } else if (contentType.includes('svg')) {
      ext = 'svg';
    } else if (contentType.includes('webp')) {
      ext = 'webp';
    }

    // Generate a unique object key using hash of the url to avoid duplicate uploads
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    const objectKey = `${prefix}/${urlHash}.${ext}`;

    const s3Url = await uploadToS3(buffer, objectKey, contentType);
    console.log(`[S3-Utils] Successfully uploaded to S3: ${s3Url}`);
    return s3Url;
  } catch (error: any) {
    console.error(`[S3-Utils] Error in downloadAndUploadToS3 for url ${url}:`, error);
    // Return the original URL as fallback so the process doesn't completely fail
    return url;
  }
}

/**
 * Scan text/markdown for Mathpix CDN links, upload them to S3 and replace links.
 */
export async function replaceMathpixImagesInText(text: string): Promise<string> {
  if (!text) return text;

  // Regex to find Mathpix image CDN URLs
  // Matches URLs like https://images.mathpix.com/... or https://cdn.mathpix.com/... that do not end with common markdown boundaries
  const mathpixUrlRegex = /https:\/\/(images|cdn)\.mathpix\.com\/[^\s\)\]\"\'\>\`]+/g;
  const matches = text.match(mathpixUrlRegex);

  if (!matches || matches.length === 0) {
    return text;
  }

  // Remove duplicates to avoid uploading the same image multiple times
  const uniqueUrls = Array.from(new Set(matches));
  console.log(`[S3-Utils] Found ${uniqueUrls.length} unique Mathpix URLs in text`);

  // Process uploads
  const replacementMap = new Map<string, string>();
  
  // Using Promise.all for parallel download/upload to keep ingestion fast
  const uploadPromises = uniqueUrls.map(async (url) => {
    const s3Url = await downloadAndUploadToS3(url);
    if (s3Url && s3Url !== url) {
      replacementMap.set(url, s3Url);
    }
  });

  await Promise.allSettled(uploadPromises);

  // Replace old URLs with new S3 URLs
  let updatedText = text;
  for (const [oldUrl, newUrl] of replacementMap.entries()) {
    // Escape regex special characters to ensure exact replacement
    const escapedUrl = oldUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedUrl, 'g');
    updatedText = updatedText.replace(regex, newUrl);
  }

  return updatedText;
}
