'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signInAPI, signOutAPI } from '@/services/auth';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' };
  }

  const response = await signInAPI(email, password);

  if (response?.data?.token) {
    const cookieStore = await cookies();

    // Store the auth token securely
    cookieStore.set('token', response.data.token, {
      httpOnly: true,
      secure: false, // Tạm thời để false để hỗ trợ cả localhost mode production
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      sameSite: 'lax',
    });

    // Minimal user data to avoid "Cookie Too Large" issues (limit 4KB)
    const minimalUser = {
      id: response.data.user.id,
      email: response.data.user.email,
      username: response.data.user.username,
      nickname: response.data.user.nickname,
      level_rank: response.data.user.level_rank,
    };

    // Store user data stringified
    cookieStore.set('user', JSON.stringify(minimalUser), {
      httpOnly: true, // Switched to true for better server-side stability
      secure: false, // Set to true in production with HTTPS
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });
  } else {
    // Return error message to display in the UI
    return { error: response?.message || 'Đăng nhập thất bại. Email hoặc mật khẩu không chính xác.' };
  }

  redirect('/');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (token) {
    await signOutAPI(token);
  }

  cookieStore.delete('token');
  cookieStore.delete('user');
  redirect('/auth/login');
}
