import { NextRequest, NextResponse } from 'next/server';
import { replaceMathpixImagesInText } from '@/lib/utils/s3-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body; // base64 data URI (e.g. data:image/png;base64,...)

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const appId = process.env.MATHPIX_APP_ID;
    const appKey = process.env.MATHPIX_APP_KEY;

    if (!appId || !appKey) {
      return NextResponse.json({ error: 'Mathpix configuration missing on server' }, { status: 500 });
    }

    // Call Mathpix API
    const response = await fetch("https://api.mathpix.com/v3/text", {
      method: 'POST',
      headers: {
        'app_id': appId,
        'app_key': appKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        src: image,
        formats: ["text"],
        data_options: {
          include_latex: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mathpix OCR Error:', errorText);
      return NextResponse.json({ error: 'Failed to process image with Mathpix' }, { status: 500 });
    }

    const data = await response.json();
    let text = data.text || '';

    // Convert any Mathpix images in the text to S3
    try {
      text = await replaceMathpixImagesInText(text);
    } catch (s3Error) {
      console.error('Error replacing Mathpix images with S3:', s3Error);
    }

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error('OCR API Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
