'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signInAPI, signOutAPI } from '@/services/auth';
import { query } from '@/lib/db';

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
      await query(
        `INSERT INTO lms_users (id, email, username, nickname, level_rank) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           email = VALUES(email), 
           username = VALUES(username), 
           nickname = VALUES(nickname), 
           level_rank = VALUES(level_rank)`,
        [user.id, user.email, user.username, user.nickname, user.level_rank || 0]
      );
    } catch (e) {
      console.error('Database Sync Error:', e);
    }

    // 2. Set Cookie đồng nhất
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Vì bạn đang chạy local, để false là an toàn nhất
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
