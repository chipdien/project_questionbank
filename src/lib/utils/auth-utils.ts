import { cookies, headers } from 'next/headers';

export interface User {
  id: number;
  email: string;
  username: string;
  nickname: string;
  level_rank?: number;
  [key: string]: any;
}

/**
 * Gets the current authenticated user from cookies.
 * Works only in Server Components, Server Actions, and Route Handlers.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const isPrefetch = headersList.get('x-nextjs-prefetch') === '1' || headersList.get('purpose') === 'prefetch';
    const userCookie = cookieStore.get('user')?.value;

    // Decode URI component because Next.js encodes cookie values
    let decodedValue = userCookie;
    try {
      decodedValue = decodeURIComponent(userCookie || '');
    } catch (e) {
      // Fallback if not encoded
    }

    try {
      if (!decodedValue) return null;
      const parsedUser = JSON.parse(decodedValue) as User;
      // Log only on non-prefetch requests to reduce noise
      if (!isPrefetch) {
        console.log(`--- [AUTH] User Authenticated: ${parsedUser.username} (ID: ${parsedUser.id}) ---`);
      }
      return parsedUser;
    } catch (e) {
      console.error('--- [AUTH] JSON Parse Error for user cookie:', e);
      return null;
    }
  } catch (error) {
    console.error('--- [AUTH] Global Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Gets the current user ID.
 */
export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Checks if the current user is an admin (level_rank >= 5).
 */
export async function isUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return (user?.level_rank || 0) >= 5;
}
