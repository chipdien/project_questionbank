# 📅 Database Schema History

Tài liệu này ghi lại các bước thay đổi cấu trúc cơ sở dữ liệu (Migration) theo dòng thời gian.

---

## [2026-04-04] - AI Classification Status

### 📝 Mô tả thay đổi
Bổ sung trạng thái để theo dõi xem một tài liệu (Document) đã được phân loại bằng AI hay chưa. Điều này giúp ngăn chặn việc gọi API AI trùng lặp và bảo vệ dữ liệu đã được người dùng chỉnh sửa.

### 🛠️ Câu lệnh SQL (DDL)
```sql
ALTER TABLE lms_documents 
ADD COLUMN is_ai_classified TINYINT(1) DEFAULT 0;
```

### 🎯 Ý nghĩa cột
- `is_ai_classified`: 
    - `0` (Mặc định): Tài liệu mới, chưa qua phân loại AI.
    - `1`: Đã thực hiện phân loại AI thành công cho toàn bộ câu hỏi trong file.

---

## [2026-04-01] - Initial Setup
- Khởi tạo các bảng cơ bản: `lms_documents`, `lms_questions`, `lms_options`, `lms_lessons`.
- (Tham khảo chi tiết tại `docs/db/lms_collections.sql`)

---
*Mọi thay đổi schema PHẢI được ghi lại tại đây kèm theo lý do và câu lệnh SQL tương ứng.*
