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
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    // Store user data stringified
    cookieStore.set('user', JSON.stringify(response.data.user), {
      httpOnly: false, // Accessible to client-side scripts if necessary for fast UI rendering
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, 
      path: '/',
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
