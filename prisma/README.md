# ⚠️ CẢNH BÁO BẢO MẬT & AN TOÀN DỮ LIỆU

> [!CAUTION]
> **QUY TẮC BẮT BUỘC:** Cơ sở dữ liệu hiện tại đang chứa dữ liệu thực tế (production). **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** chạy bất kỳ câu lệnh nào làm thay đổi, ghi đè hoặc xóa bỏ dữ liệu hiện có (như `prisma migrate reset` hoặc `prisma db push --force-reset`).

---

## 🚫 Lệnh Bị Cấm (Forbidden Commands)

1. **`npx prisma migrate reset`**: Lệnh này sẽ **XÓA SẠCH** toàn bộ database và dữ liệu. Cấm chạy trên mọi môi trường ngoại trừ local database trống.
2. **`npx prisma db push --force-reset`**: Lệnh này sẽ bỏ qua lịch sử migration và ép buộc reset lại database làm mất dữ liệu.

---

## 🛡️ Hướng dẫn Thay đổi Cấu trúc An toàn (Safe Schema Upgrade)

Để sửa đổi cấu trúc bảng, thêm trường, hoặc tạo bảng mới mà không mất dữ liệu:

### 1. Đồng bộ cấu trúc (Migrations)
* Khi bạn thay đổi tệp `schema.prisma`, hãy luôn tạo tệp migration thay thế bằng lệnh:
  ```bash
  npx prisma migrate dev --create-only
  ```
  Lệnh này sẽ **chỉ tạo file SQL** thay đổi cấu trúc trong thư mục `prisma/migrations` mà không áp dụng nó trực tiếp vào database ngay lập tức, cho phép bạn kiểm tra mã SQL xem có lệnh gây mất mát dữ liệu (như `DROP COLUMN` hoặc `DROP TABLE`) không.

### 2. Triển khai lên Production (aaPanel)
* Để áp dụng các thay đổi cấu trúc lên môi trường production đã có dữ liệu mà không sợ mất mát, hãy sử dụng lệnh sau:
  ```bash
  npx prisma migrate deploy
  ```
  Lệnh này chỉ thực hiện các câu lệnh cập nhật cấu trúc (`ALTER TABLE`, `CREATE TABLE`) được định nghĩa trong thư mục `migrations` và không bao giờ cố gắng reset lại database của khách hàng.
