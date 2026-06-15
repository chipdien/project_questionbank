export const S3_PROXY_PATH = '/api/s3/object';

export interface S3ObjectRef {
  bucket?: string;
  key: string;
}

const decodePathPart = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export function getS3ObjectRefFromUrl(rawUrl: string): S3ObjectRef | null {
  if (!rawUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith('.amazonaws.com')) {
    return null;
  }

  const path = parsed.pathname.replace(/^\/+/, '');
  if (!path) {
    return null;
  }

  const virtualHostMatch = host.match(/^(.+)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/);
  if (virtualHostMatch) {
    return {
      bucket: virtualHostMatch[1],
      key: decodePathPart(path),
    };
  }

  const pathStyleMatch = host.match(/^s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/);
  if (pathStyleMatch) {
    const [bucket, ...keyParts] = path.split('/');
    const key = keyParts.join('/');
    if (!bucket || !key) return null;

    return {
      bucket: decodePathPart(bucket),
      key: decodePathPart(key),
    };
  }

  return null;
}

export function getS3ObjectRefFromProxyUrl(rawUrl: string, baseUrl = 'http://localhost'): S3ObjectRef | null {
  if (!rawUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl, baseUrl);
  } catch {
    return null;
  }

  if (parsed.pathname !== S3_PROXY_PATH) {
    return null;
  }

  const key = parsed.searchParams.get('key');
  if (!key) {
    return null;
  }

  return {
    bucket: parsed.searchParams.get('bucket') || undefined,
    key,
  };
}

export function toS3ProxyUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  if (getS3ObjectRefFromProxyUrl(rawUrl)) return rawUrl;

  const ref = getS3ObjectRefFromUrl(rawUrl);
  if (!ref) return rawUrl;

  const params = new URLSearchParams({ key: ref.key });
  if (ref.bucket) {
    params.set('bucket', ref.bucket);
  }

  return `${S3_PROXY_PATH}?${params.toString()}`;
}

const s3UrlRegex = /https?:\/\/[A-Za-z0-9.-]*s3[.-][A-Za-z0-9.-]*amazonaws\.com\/[^\s]+/gi;
const trailingUrlBoundaryRegex = /[\u0022\u0027<>\)\/\].,;]+$/;

export function rewriteS3UrlsToProxy(text: string): string {
  if (!text) return text;

  return text.replace(s3UrlRegex, (match) => {
    const trailingBoundary = match.match(trailingUrlBoundaryRegex)?.[0] || '';
    const url = trailingBoundary ? match.slice(0, -trailingBoundary.length) : match;
    return toS3ProxyUrl(url) + trailingBoundary;
  });
}
