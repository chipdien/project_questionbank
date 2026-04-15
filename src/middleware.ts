import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Các sub-path không cần bảo vệ (asset tĩnh, auth...)
const publicPaths = ['/auth/login', '/auth/register', '/api', '/_next', '/favicon.ico']

// Middleware lưu token vào cookie để đối chứng
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );

  const isAuthPath = path.startsWith('/auth');

  // Chưa đăng nhập mà truy cập trang Protected (không phải public route) -> Redirect về Login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Đã đăng nhập nhưng lại vào trang Auth -> Redirect vể Root
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
