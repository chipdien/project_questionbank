'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions/auth.action';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen bg-(--color-background) flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-sm sm:max-w-xl bg-(--color-surface) p-8 sm:p-10 rounded-2xl shadow-xl border border-outline-variant relative z-10 glass-panel">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 shadow-inherit">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-(--color-on-surface) tracking-tight font-headline">VietElite</h1>
          <p className="text-on-surface-variant mt-2 text-sm font-medium">Hệ Thống Ngân Hàng Câu Hỏi</p>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-4 text-sm text-on-error-container bg-error-container rounded-lg flex items-start gap-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-error" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <label htmlFor="email" className="block text-sm font-semibold text-(--color-on-surface)">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="nhap_email@vietelite.edu.vn"
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-(--color-on-surface) placeholder:text-outline"
            />
          </div>

          <div className="space-y-2.5">
            <label htmlFor="password" className="block text-sm font-semibold text-(--color-on-surface)">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-(--color-on-surface) placeholder:text-outline"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-primary hover:bg-primary-container text-(--color-on-primary) font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed group mt-8 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Đăng Nhập
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        </form>
      </div>

      <div className="fixed bottom-4 left-0 right-0 text-center text-sm text-outline">
        &copy; {new Date().getFullYear()} VietElite Education. All rights reserved.
      </div>
    </div>
  );
}
