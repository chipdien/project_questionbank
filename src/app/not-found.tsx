import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-(--color-background) flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
        <h2 className="text-3xl font-bold text-(--color-on-surface)">Không Tìm Thấy Trang</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Đường dẫn bạn đang tìm kiếm không tồn tại hoặc đã bị di dời. Xin vui lòng kiểm tra lại URL hoặc quay về trang quản trị.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-container text-(--color-on-primary) font-medium rounded-lg shadow-md transition-all mt-4"
        >
          <Home className="w-5 h-5" />
          Quay lại Trang Chủ
        </Link>
      </div>
    </div>
  );
}
