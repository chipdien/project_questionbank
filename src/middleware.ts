import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Kiểm tra các header đặc biệt
  const isPrefetch = request.headers.get('x-nextjs-prefetch') === '1' || request.headers.get('purpose') === 'prefetch';

  // 2. Lấy toàn bộ cookies để debug
  const token = request.cookies.get('token')?.value;
  const userId = request.cookies.get('userId')?.value;

  // Xác định xem người dùng đã được xác thực chưa
  const isAuthenticated = !!token && !!userId && !isNaN(parseInt(userId));

  // 3. Định nghĩa các tuyến đường
  const isAuthPage = pathname.startsWith('/auth/login');
  const isPublicFile =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('.');

  // Nếu là file tĩnh hoặc API thì bỏ qua
  if (isPublicFile) {
    return NextResponse.next();
  }

  // 4. Logic điều hướng
  
  // NẾU LÀ PREFETCH: Không bao giờ thực hiện redirect để tránh làm hỏng cache của Next.js
  if (isPrefetch) {
    return NextResponse.next();
  }

  // Nếu người dùng CHƯA đăng nhập mà truy cập trang nội bộ
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Nếu người dùng ĐÃ đăng nhập mà cố tình vào trang Login
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Cấu hình Matcher để tối ưu hiệu năng, chỉ chạy middleware cho các route cần thiết
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
