export interface User {
  id: number;
  email: string;
  username: string;
  nickname: string;
  level_rank?: number;
  phone?: string;
  [key: string]: any;
}

export interface AuthResponse {
  data?: {
    user: User;
    token: string;
  };
  message?: string;
  code?: string | number;
}

export async function signInAPI(email: string, password: string): Promise<AuthResponse> {
  const url = 'https://v6.vietelite.edu.vn/api/auth:signIn';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    
    if (!res.ok) {
        return {
            message: data.message || "Tài khoản hoặc mật khẩu không chính xác.",
        }
    }

    return data;
  } catch (error: any) {
    console.error('SignIn API Error:', error);
    return { message: "Lỗi kết nối tới hệ thống xác thực. Vui lòng thử lại sau." };
  }
}

export async function signOutAPI(token: string): Promise<boolean> {
  const url = 'https://v6.vietelite.edu.vn/api/auth:signOut';
  try {
    // Chúng ta gửi chuỗi Bearer Token theo chuẩn để backend invalidate
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return res.ok;
  } catch (error) {
    console.error('SignOut API Error:', error);
    return false;
  }
}

