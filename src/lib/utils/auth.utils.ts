import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { isAdminRank } from '@/lib/constants/auth.constant';

export interface User {
  id: number;
  email: string;
  username: string;
  nickname: string | null;
  level_rank: number | null;
  [key: string]: any;
}

/**
 * Gets the current authenticated user by looking up the userId cookie in the database.
 * Works only in Server Components, Server Actions, and Route Handlers.
 */
export async function getCurrentUser(): Promise<User | null> {
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
    const user = await prisma.lms_users.findUnique({
      where: { id: userId },
    });
    
    if (user) {
      const formattedUser: User = {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        level_rank: user.level_rank,
      };

      return formattedUser;
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
  const user = await getCurrentUser();
  return isAdminRank(user?.level_rank);
}
