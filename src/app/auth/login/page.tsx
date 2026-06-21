'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { loginAction } from '@/lib/actions/auth.action';
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import LogoImg from '@/app/logo.png';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Theo dõi khi có lỗi đăng nhập trả về từ Server Action
  useEffect(() => {
    if (state?.error) {
      if (state.email) {
        setEmail(state.email);
      }
      // Reset mật khẩu
      setPassword('');
      // Focus vào ô nhập mật khẩu
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }
  }, [state]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Xác định xem field nào đang có lỗi
  const isEmailError = state?.errorField === 'email';
  const isPasswordError = state?.errorField === 'password';
  const isGeneralError = state?.error && state?.errorField !== 'email' && state?.errorField !== 'password';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decoratives - Màu thương hiệu VietElite dịu nhẹ */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#348E38]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#348E38]/8 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100 relative z-10">
        {/* Logo & Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Image 
              src={LogoImg} 
              alt="VietElite Logo" 
              width={160} 
              height={50} 
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-headline">Hệ Thống Ngân Hàng Câu Hỏi</h1>
        </div>

        <form action={formAction} noValidate className="space-y-5">
          {/* Lỗi chung (không thuộc Email hay Password cụ thể) */}
          {isGeneralError && (
            <div className="p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Email Input Field */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhap_email@vietelite.edu.vn"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50/50 border rounded-xl focus:outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium ${
                  isEmailError 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                    : 'border-slate-200 focus:ring-2 focus:ring-[#348E38]/20 focus:border-[#348E38]'
                }`}
              />
            </div>
            {/* Hiển thị lỗi trực tiếp dưới field Email */}
            {isEmailError && (
              <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1 pl-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {state.error}
              </p>
            )}
          </div>

          {/* Password Input Field */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                ref={passwordInputRef}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-11 pr-12 py-3 bg-slate-50/50 border rounded-xl focus:outline-none transition-all text-slate-800 placeholder:text-slate-400 ${
                  isPasswordError 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
                    : 'border-slate-200 focus:ring-2 focus:ring-[#348E38]/20 focus:border-[#348E38]'
                }`}
              />
              {/* Show/Hide Password Toggle Button */}
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* Hiển thị lỗi trực tiếp dưới field Mật khẩu */}
            {isPasswordError && (
              <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1 pl-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {state.error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-[#348E38] hover:bg-[#2d7c31] active:scale-[0.98] text-white font-semibold rounded-xl shadow-md shadow-[#348E38]/10 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#348E38]/30 disabled:opacity-70 disabled:cursor-not-allowed group mt-6 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Đăng Nhập
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        </form>
      </div>

      <div className="fixed bottom-4 left-0 right-0 text-center text-xs text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} VietElite Education. All rights reserved.
      </div>
    </div>
  );
}
