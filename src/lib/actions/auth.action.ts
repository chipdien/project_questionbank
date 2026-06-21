'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signInAPI, signOutAPI } from '@/lib/services/auth.service';
import { prisma } from '@/lib/db';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email) {
    return { 
      error: 'Vui lòng nhập tài khoản.', 
      email,
      errorField: 'email'
    };
  }

  // Kiểm tra định dạng email đầy đủ (như @gmail.com hay @vietelite.edu.vn)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      error: 'Email không đúng định dạng (ví dụ: name@vietelite.edu.vn).',
      email,
      errorField: 'email'
    };
  }

  // BƯỚC 1: Kiểm tra xem Email có tồn tại trong hệ thống (DB local lms_users) hay không
  let isEmailExist = false;
  try {
    const localUser = await prisma.lms_users.findFirst({
      where: { email }
    });
    isEmailExist = !!localUser;
  } catch (e) {
    console.error('Check local email existence failed:', e);
  }

  // Nếu Email KHÔNG tồn tại, dừng lại và báo lỗi tài khoản không tồn tại ngay lập tức
  if (!isEmailExist) {
    return {
      error: 'Tài khoản không tồn tại.',
      email,
      errorField: 'email'
    };
  }

  // BƯỚC 2: Khi email đã tồn tại, kiểm tra xem mật khẩu có bị trống hay không
  if (!password) {
    return { 
      error: 'Vui lòng nhập mật khẩu.', 
      email,
      errorField: 'password'
    };
  }

  // BƯỚC 3: Gọi API để xác thực mật khẩu
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
    // Vì Email đã được kiểm tra tồn tại ở bước 1, nếu API đăng nhập lỗi thì chắc chắn là do sai mật khẩu
    return { 
      error: 'Mật khẩu không chính xác.', 
      email, 
      errorField: 'password' 
    };
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
