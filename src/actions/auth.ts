'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signInAPI, signOutAPI } from '@/services/auth';
import { prisma } from '@/lib/db';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' };
  }

  const response = await signInAPI(email, password);

  if (response?.data?.token) {
    const cookieStore = await cookies();
    const user = response.data.user;

    // 1. Đồng bộ DB trước
    try {
      await prisma.lms_users.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          username: user.username,
          nickname: user.nickname,
          level_rank: user.level_rank || 0,
        },
        create: {
          id: user.id,
          email: user.email,
          username: user.username,
          nickname: user.nickname,
          level_rank: user.level_rank || 0,
        },
      });
    } catch (e) {
      console.error('Database Sync Error:', e);
    }

    // 2. Set Cookie đồng nhất
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax' as const, // Ép kiểu để tránh lỗi TypeScript
    };

    cookieStore.set('token', response.data.token, cookieOptions);
    cookieStore.set('userId', user.id.toString(), cookieOptions);

    // Xóa cookie cũ 'user' (nếu nó đang bị lỗi năm 1970)
    cookieStore.set('user', '', { ...cookieOptions, maxAge: 0 });

  } else {
    return { error: response?.message || 'Đăng nhập thất bại.' };
  }

  // 3. Redirect PHẢI nằm ngoài mọi block logic xử lý dữ liệu
  redirect('/');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (token) {
    try {
      await signOutAPI(token);
    } catch (e) {
      console.warn('Sign out API failed:', e);
    }
  }

  cookieStore.delete('token');
  cookieStore.delete('userId');
  cookieStore.delete('user'); // Đề phòng user cũ
  redirect('/auth/login');
}
