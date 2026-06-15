# 📅 Database Schema History

Tài liệu này ghi lại các bước thay đổi cấu trúc cơ sở dữ liệu (Migration) theo dòng thời gian.

---

## [2026-06-15] - Separate Answer/Solution File Upload

### 📝 Mô tả thay đổi
- Bổ sung cột `link_s3_answer` vào bảng `lms_documents` để lưu link file Đáp án/Lời giải gốc trên S3.
- Hỗ trợ luồng tải lên đồng thời 2 file: 1 file Đề bài và 1 file Đáp án/Lời giải riêng biệt. AI (Gemini) sẽ đối chiếu đề bài với đáp án/lời giải tương ứng để điền chính xác `hint` (lời giải) và `weight = 1` (đáp án đúng) khi phân tích.

### 🛠️ Câu lệnh SQL (DDL)
```sql
ALTER TABLE lms_documents ADD COLUMN link_s3_answer TEXT DEFAULT NULL;
```

### 🎯 Ý nghĩa cột
- `link_s3_answer`: Link S3 tới file đáp án gốc. `NULL` nếu tài liệu chỉ có file đề bài (luồng cũ).

---

## [2026-04-16] - Local Users Synchronization & Async Tasks
### 📝 Mô tả thay đổi
- Chuyển đổi phương thức lưu trữ Cookie User bằng đồng bộ Database cục bộ. Tạo bảng `lms_users` làm bản sao hồ sơ của người dùng từ API đăng nhập, giúp giải quyết triệt để lỗi "JSON parse/encode" từ Cookie.
- Bổ sung cột `link_s3` vào bảng `lms_documents` nhằm mục đích lưu link file thô trên S3 cho những lần tải lên (sử dụng ở Backend Ingestion Server).
- Tạo bảng `lms_processing_tasks` để theo dõi tiến trình upload và phân tích AI (Ingestion Pipeline) ở chế độ Async, giúp tránh bị timeout khi parsing dữ liệu thô lớn.

### 🛠️ Câu lệnh SQL (DDL)
```sql
CREATE TABLE lms_users (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  nickname VARCHAR(255),
  level_rank INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE lms_documents 
ADD COLUMN link_s3 TEXT DEFAULT NULL;


CREATE TABLE lms_processing_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_hash VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  raw_text LONGTEXT DEFAULT NULL,
  document_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_file_hash (file_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
---

## [2026-04-08] - Custom PDF Export & History

### 📝 Mô tả thay đổi
Thiết lập hệ thống lưu trữ tài liệu đã xuất (Export) sang PDF riêng biệt. Hệ thống này bao gồm 2 bảng để quản lý thông tin file PDF trên S3 và quan hệ giữa các câu hỏi trong tài liệu đó. Đã bổ sung cột `content_hash` để kiểm tra trùng nôi dung.

### 🛠️ Câu lệnh SQL (DDL)
```sql
-- Bảng lưu thông tin tài liệu custom
CREATE TABLE lms_documents_custom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  pdf_url TEXT,
  s3_object_key VARCHAR(255),
  content_blocks LONGTEXT, -- Lưu trữ cấu trúc block của editor
  content_hash VARCHAR(64), -- Bổ sung mới cho việc kiểm tra trùng nội dung
  created_by_id INT, -- ID người tạo tài liệu custom
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_content_hash (content_hash),
  INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu quan hệ giữa tài liệu custom và câu hỏi
CREATE TABLE lms_documents_custom_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_custom_id INT NOT NULL,
  question_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cập nhật cho DB đã tồn tại: 
-- ALTER TABLE lms_documents_custom ADD COLUMN content_hash VARCHAR(64) AFTER s3_object_key;
-- ALTER TABLE lms_documents_custom ADD COLUMN created_by_id INT NULL AFTER content_hash;
-- CREATE INDEX idx_content_hash ON lms_documents_custom(content_hash);
-- CREATE INDEX idx_title ON lms_documents_custom(title);
```

### 🎯 Ý nghĩa bảng
- `lms_documents_custom`: Lưu metadata của đề thi/tài liệu sau khi đã export thành công, bao gồm link S3 và mã hash nội dung.
- `lms_documents_custom_questions`: Lưu danh sách các câu hỏi thuộc về tài liệu đó để hỗ trợ tính năng "Mở lại trong editor".


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
