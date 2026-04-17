import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-(--color-background) flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-24 h-24 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-(--color-on-surface)">Không Có Quyền Truy Cập (403)</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Tài khoản của bạn không có đủ thẩm quyền để xem tài nguyên này, hoặc phiên đăng nhập gặp vấn đề. Liên hệ ban quản trị nếu đây là sự nhầm lẫn.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-md transition-all mt-4"
        >
          Đến trang Đăng nhập
        </Link>
      </div>
    </div>
  );
}
