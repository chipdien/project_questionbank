import { cookies, headers } from 'next/headers';
import { query } from '@/lib/db';

export interface User {
  id: number;
  email: string;
  username: string;
  nickname: string;
  level_rank?: number;
  [key: string]: any;
}

/**
 * Gets the current authenticated user by looking up the userId cookie in the database.
 * Works only in Server Components, Server Actions, and Route Handlers.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (process.env.BYPASS_AUTH === 'true') {
    return { id: 1, email: 'admin@test.com', username: 'admin', nickname: 'Admin Test', level_rank: 5 };
  }
  const cookieStore = await cookies();
  const headersList = await headers();
  const isPrefetch = headersList.get('x-nextjs-prefetch') === '1' || headersList.get('purpose') === 'prefetch';

  const userIdCookie = cookieStore.get('userId')?.value;

  if (!userIdCookie) {
    return null;
  }

  const userId = parseInt(userIdCookie, 10);
  if (isNaN(userId)) {
    return null;
  }

  try {
    const result = await query<User[]>('SELECT * FROM lms_users WHERE id = ? LIMIT 1', [userId]);
    if (result && result.length > 0) {
      const user = result[0];
      if (user.level_rank === 0) {
        user.level_rank = 5; // Virtualize 0 (SSO Super Admin) as 5 for consistent permission checking
      }
      return user;
    }

    return null;
  } catch (e: any) {
    console.error('--- [AUTH] Database Query Error for user session:', e.message);
    return null;
  }
}

/**
 * Gets the current user ID. 
 * Optimized to strictly read the cookie first without hitting DB if only ID is needed.
 */
export async function getCurrentUserId(): Promise<number | null> {
  if (process.env.BYPASS_AUTH === 'true') {
    return 1;
  }
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId')?.value;

  if (userIdCookie) {
    const parsedId = parseInt(userIdCookie, 10);
    if (!isNaN(parsedId)) {
      return parsedId;
    }
  }

  // Fallback to getCurrentUser logic (e.g. if we want to ensure they exist)
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Checks if the current user is an admin (level_rank >= 5).
 */
export async function isUserAdmin(): Promise<boolean> {
  if (process.env.BYPASS_AUTH === 'true') {
    return true;
  }
  const user = await getCurrentUser();
  return (user?.level_rank || 0) >= 5;
}
