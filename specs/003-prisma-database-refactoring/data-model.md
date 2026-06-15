# Database Data Model mapping via Prisma

**Feature**: [spec.md](./spec.md)

Tài liệu này mô tả cách các thực thể trong cơ sở dữ liệu được Prisma ánh xạ và các trường kiểu dữ liệu đặc biệt cần lưu ý.

## 1. Các thực thể chính (Key Entities)

### lms_difficulties
Bảng lưu trữ cấu hình độ khó của câu hỏi.
- `id` (`Int`): Khóa chính, tự tăng.
- `name` (`String`): Tên độ khó (unique).
- `color_code` (`String?`): Mã màu CSS đại diện.
- `display_order` (`Int?`): Thứ tự hiển thị.

### lms_documents
Tài liệu được upload lên hệ thống.
- `id` (`BigInt`): Khóa chính, tự tăng.
- `title` (`String?`): Tiêu đề tài liệu.
- `content` (`String?`): Nội dung văn bản thô.
- `public` (`String?`): Trạng thái chia sẻ ("1" hoặc "0").
- `link_s3` (`String?`): Đường dẫn lưu file trên S3.
- `created_by_id` (`BigInt?`): ID người tạo.
- `teacher_owned` (`BigInt?`): ID giáo viên sở hữu.

### lms_questions
Các câu hỏi được bóc tách từ tài liệu.
- `id` (`BigInt`): Khóa chính, tự tăng.
- `content` (`String?`): Nội dung/câu hỏi thô.
- `statement` (`String?`): Phát biểu câu hỏi.
- `hint` (`String?`): Gợi ý giải.
- `question_type` (`String?`): Loại câu hỏi (ví dụ: `SINGLE_CHOICE`).
- `question_difficulty` (`String?`): Tên độ khó liên kết (liên kết text trực tiếp đến `lms_difficulties.name`).

### lms_options
Các phương án lựa chọn đáp án của câu hỏi.
- `id` (`BigInt`): Khóa chính, tự tăng.
- `question_id` (`BigInt?`): ID câu hỏi liên kết.
- `content` (`String?`): Nội dung đáp án.
- `weight` (`Float?`): Trọng số điểm (ví dụ: 1.0 cho đáp án đúng, 0 cho đáp án sai).
- `order` (`BigInt?`): Thứ tự hiển thị phương án.

### lms_questions_documents
Bảng quan hệ nhiều-nhiều liên kết câu hỏi và tài liệu chứa nó.
- `document_id` (`BigInt`): ID tài liệu.
- `question_id` (`BigInt`): ID câu hỏi.
- `created_at` (`DateTime`)
- `updated_at` (`DateTime`)

### lms_processing_tasks
Lưu vết trạng thái bóc tách tài liệu bằng AI.
- `id` (`Int`): Khóa chính, tự tăng.
- `file_hash` (`String`): Mã băm nội dung file để kiểm tra trùng lặp.
- `file_name` (`String`): Tên file tài liệu gốc.
- `status` (`String?`): Trạng thái xử lý (`PENDING`, `COMPLETED`, `FAILED`).
- `raw_text` (`String?`): Văn bản thô sau khi parse.
- `document_id` (`Int?`): ID document được sinh ra sau khi hoàn thành.

---

## 2. Lưu ý về ánh xạ quan hệ (Relationships)
Vì schema hiện tại được sinh ngược từ CSDL MySQL có sẵn (Introspective schema) và không cấu hình rõ ràng các quan hệ khóa ngoại (foreign keys) trong tệp `schema.prisma`, Prisma sẽ truy vấn dữ liệu theo phương pháp kết hợp thủ công hoặc qua các model trung gian (như `lms_questions_documents`) bằng cách khớp ID trực tiếp. 
Chúng ta sẽ thực hiện các phép join thủ công qua các API ORM của Prisma (ví dụ truy vấn bảng liên kết trước rồi truy vấn bảng dữ liệu chính) để tuân thủ thiết kế hiện tại mà không thay đổi schema CSDL.
