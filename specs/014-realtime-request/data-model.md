# Data Model: lms_notifications

## 1. Migration Overview
Thêm bảng `lms_notifications` vào database để lưu trữ dữ liệu thông báo cho người dùng.

## 2. Prisma Schema Additions

Bổ sung model sau vào file `prisma/schema.prisma`:

```prisma
model lms_notifications {
  id           BigInt    @id @default(autoincrement())
  user_id      BigInt    // ID người nhận thông báo
  type         String    @db.VarChar(50) // Phân loại thông báo (VD: "REQUEST_CREATED", "REQUEST_APPROVED", "REQUEST_REJECTED")
  title        String    @db.VarChar(255)
  content      String?   @db.LongText
  reference_id BigInt?   // Chứa ID của request hoặc record liên quan
  is_read      Boolean   @default(false)
  created_at   DateTime? @default(now()) @db.Timestamp(0)

  @@index([user_id], map: "idx_lms_notifications_user_id")
  @@index([is_read], map: "idx_lms_notifications_is_read")
  @@index([reference_id], map: "idx_lms_notifications_reference_id")
}
```

## 3. Data Dictionary

| Tên Cột | Kiểu Dữ Liệu | Giải Thích |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | Khóa chính tự tăng |
| `user_id` | BigInt | ID của người nhận thông báo (Admin hoặc Giáo viên) |
| `type` | VarChar(50) | Mã loại thông báo để client có thể map ra icon/màu sắc tương ứng |
| `title` | VarChar(255) | Tiêu đề ngắn gọn của thông báo |
| `content` | LongText | Nội dung chi tiết nếu có |
| `reference_id` | BigInt | Khóa ngoại mềm (không bắt buộc) trỏ đến bản ghi gốc. Trong trường hợp này là `id` của bảng `lms_requests` |
| `is_read` | Boolean | Cờ đánh dấu đã đọc (mặc định false) |
| `created_at` | DateTime | Thời điểm sinh ra thông báo |

## 4. Hành vi & Workflow
- **Insert**: Khi server xử lý các action tạo hoặc cập nhật Request, logic sẽ tạo ra 1 record mới tại đây (user_id sẽ dựa vào người gửi hoặc admin).
- **Select**: Được gọi khi user mở popup hoặc gọi API stream kết nối lần đầu (thường lấy TOP 20 hoặc lọc `is_read = false`).
- **Update**: Khi user click vào một thông báo, frontend gọi API set `is_read = true` cho `id` đó.
- **Delete**: Không xóa cứng, có thể dọn rác định kỳ các thông báo cũ sau X tháng.
