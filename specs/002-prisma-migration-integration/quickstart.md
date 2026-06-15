# Quickstart: Kiểm thử và Xác minh Prisma Integration

Tài liệu này hướng dẫn chạy các lệnh kiểm thử để xác minh Prisma ORM hoạt động chính xác sau khi tích hợp.

---

## 1. Các lệnh kiểm thử hệ thống (Validation Commands)

Sau khi cài đặt các thư viện, chạy các lệnh sau để kiểm tra:

### Bước A: Tạo file schema và Sync Client
```bash
# 1. Khởi tạo Prisma Client dựa trên file schema.prisma
npx prisma generate
```
* **Kết quả kỳ vọng:** Dòng chữ `✔ Generated Prisma Client` hiển thị mà không có lỗi cú pháp.

### Bước B: Kiểm tra Migration trên môi trường Local
```bash
# 2. Tạo bản ghi migration đầu tiên dựa trên database hiện có
npx prisma migrate dev --name init --create-only
```
* **Kết quả kỳ vọng:** File SQL migration được tạo ra thành công trong thư mục `prisma/migrations/`.

---

## 2. Kiểm thử end-to-end bằng Script chạy thử

Tạo một tệp test nhanh tại `.github/workflows/test-prisma.ts` hoặc chạy thử bằng lệnh:

```typescript
import prisma from '../../src/lib/db/prisma';

async function testConnection() {
  try {
    // Thử truy vấn dữ liệu từ bảng lms_syllabus
    const syllabusList = await prisma.lms_syllabus.findMany({
      take: 5
    });
    console.log('✅ Kết nối Prisma thành công! Số lượng bản ghi lấy được:', syllabusList.length);
  } catch (error) {
    console.error('❌ Lỗi kết nối Prisma:', error);
  }
}

testConnection();
```
Chạy file test này bằng `tsx`:
```bash
npx tsx tests/test-prisma.ts
```
* **Kết quả kỳ vọng:** `✅ Kết nối Prisma thành công! Số lượng bản ghi lấy được: X` hiển thị trên màn hình terminal.
