import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    // Initialize S3 Client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Format filename securely: timestamp-uuid-original.pdf
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const objectKey = `exams/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: objectKey,
      ContentType: contentType || "application/pdf",
    });

    // Generate Pre-signed URL (Valid for 60 seconds)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // Construct the direct public URL (Assuming bucket is public-read or using CloudFront later)
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;

    return NextResponse.json({ 
      signedUrl, 
      objectKey, 
      url
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
