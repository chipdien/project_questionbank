# Research: Tích hợp Prisma ORM và Hệ thống Migration

Dưới đây là kết quả nghiên cứu và phương án triển khai tích hợp Prisma ORM vào dự án VietElite Question Bank.

---

## 1. Phương án khởi tạo thực thể Prisma Client trong Next.js

* **Lựa chọn:** Singleton Pattern cho Prisma Client.
* **Chi tiết:** Trong môi trường phát triển (development) của Next.js, cơ chế Hot Reload (Fast Refresh) sẽ khởi chạy lại mã nguồn liên tục. Nếu khởi tạo Prisma Client bình thường (`new PrismaClient()`), mỗi lần reload sẽ tạo ra một kết nối mới, dẫn đến lỗi cạn kiệt kết nối database (Connection Limit Exceeded).
* **Giải pháp:** Sử dụng biến toàn cục `globalThis` để duy trì duy nhất một instance trong môi trường development.
* **Mã nguồn đề xuất tại `src/lib/db/prisma.ts`:**
  ```typescript
  import { PrismaClient } from '@prisma/client';

  const prismaClientSingleton = () => {
    return new PrismaClient();
  };

  declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  }

  const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

  export default prisma;

  if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
  ```

---

## 2. Ánh xạ các bảng từ `vietelite_qb.sql` sang Prisma Schema

* **Đặc thù cơ sở dữ liệu hiện tại:**
  * Có 22 bảng, bao gồm các bảng dữ liệu chính và các bảng liên kết quan hệ nhiều - nhiều (Many-to-Many joint tables) bắt đầu bằng tiền tố `lms_`.
  * Khóa chính trong các bảng chính sử dụng `bigint` tự tăng (`AUTO_INCREMENT`) hoặc `int`.
  * Các bảng liên kết sử dụng khóa chính phức hợp gồm hai khóa ngoại, ví dụ `PRIMARY KEY (question_id, lesson_id)`.
  * Các trường thời gian `created_at`, `updated_at` sử dụng kiểu dữ liệu `datetime(3)`.

* **Chi tiết cấu hình trong `schema.prisma`:**
  * **Provider:** `mysql`
  * **Datetime:** Ánh xạ các trường thời gian bằng `@db.DateTime(3)` hoặc `@db.Timestamp` tùy theo tệp SQL.
  * **BigInt:** Các trường `bigint` trong MySQL được ánh xạ sang kiểu `BigInt` của Prisma. Khi trả về JSON trong Next.js API, ta cần chuyển kiểu dữ liệu này sang `string` hoặc `number` (hoặc cấu hình hàm serialize JSON toàn cục) vì kiểu dữ liệu `BigInt` không tự động chuyển đổi sang JSON chuẩn.

---

## 3. Quy trình chạy Migration an toàn cho Production (aaPanel)

* **Vấn đề:** Cơ sở dữ liệu trên production của khách hàng đã có sẵn dữ liệu và cấu trúc bảng của 22 thực thể. Nếu chạy trực tiếp `prisma migrate dev` hoặc `prisma db push`, hệ thống có thể cố gắng tạo lại các bảng và xóa sạch dữ liệu cũ.
* **Giải pháp: Baselining Migrations**
  1. Tạo thư mục migration ban đầu đại diện cho cấu trúc cũ bằng lệnh:
     ```bash
     npx prisma migrate dev --name init --create-only
     ```
     Lệnh này chỉ tạo file SQL migration trong thư mục `prisma/migrations` mà không chạy nó lên database.
  2. Áp dụng trạng thái này lên cơ sở dữ liệu đã có sẵn mà không thực thi SQL bằng cách đánh dấu nó là đã hoàn thành:
     ```bash
     npx prisma migrate resolve --applied <tên_thư_mục_migration_init>
     ```
  3. Đối với các lập trình viên mới setup database trống: Chỉ cần chạy `npx prisma migrate dev`, Prisma sẽ tự động chạy file init SQL này để sinh database hoàn chỉnh.

---

## 4. Giải pháp chạy SQL thuần song song (Gradual Migration)

* **Lựa chọn:** Tái cấu hình hàm `query()` trong [src/lib/db/index.ts](file:///Volumes/DATA/workspace/vietelite_questionbank/src/lib/db/index.ts) để chạy thông qua `prisma.$queryRawUnsafe` hoặc duy trì tạm thời thư viện `mysql2` kết nối chung với connection pool cũ.
* **Đề xuất tốt nhất:** Duy trì file [src/lib/db/index.ts](file:///Volumes/DATA/workspace/vietelite_questionbank/src/lib/db/index.ts) sử dụng `mysql2` trong giai đoạn đầu để các câu lệnh SQL thuần hiện tại không bị ảnh hưởng. Sau đó, viết mới các chức năng API/Actions sử dụng Prisma Client độc lập. Khi toàn bộ dự án đã chuyển đổi xong, ta có thể xóa hoàn toàn `mysql2`.
