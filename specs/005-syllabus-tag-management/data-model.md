# Data Model: Quản lý Giáo trình (Syllabus/Topics) và Thẻ (Tags)

## Các Thực thể Chính (Entities)

### 1. Topic (`lms_topics`)
Đại diện cho các nút trong cây phân cấp giáo trình (có thể là Syllabus, Chuyên đề, Bài học, v.v.).

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|------------|--------------|-----------|-------|
| `id` | BigInt | Primary Key, Auto-increment | Định danh chủ đề |
| `title` | String (VarChar 255) | Nullable | Tiêu đề hiển thị của chủ đề |
| `code` | String (VarChar 255) | Unique, Nullable | Mã code duy nhất để định danh hoặc đồng bộ |
| `content` | String (LongText) | Nullable | Mô tả chi tiết nội dung chủ đề |
| `parent_id` | BigInt | Self-relation, Nullable | ID của chủ đề cha |
| `path` | String (VarChar 512) | Index, Nullable | Materialized Path lưu phả hệ (dạng `/1/12/35/`) |
| `order_index` | BigInt | Nullable | Thứ tự sắp xếp các chủ đề cùng cấp |
| `syllabus_id` | BigInt | Nullable | ID liên kết tới giáo trình lớn nếu có |
| `type` | String (VarChar 50) | Nullable | Loại node (ví dụ: `SYLLABUS`, `TOPIC`, `LESSON`) |
| `created_at` | DateTime | Nullable | Thời gian khởi tạo |
| `updated_at` | DateTime | Nullable | Thời gian cập nhật gần nhất |

**Mối quan hệ**:
- Tự liên kết Một-Nhiều: `parent_id` liên kết tới `id` của chính bảng này.
- Nhiều-Nhiều với `lms_questions` qua bảng trung gian `lms_topics_questions`.

---

### 2. Tag (`lms_tags`)
Dùng để phân loại đa chiều cho câu hỏi một cách linh hoạt.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|------------|--------------|-----------|-------|
| `id` | BigInt | Primary Key, Auto-increment | Định danh thẻ tag |
| `name` | String (VarChar 100) | Unique | Tên thẻ tag (Ví dụ: "Toán tư duy", "Chuyên Sư Phạm 2026") |
| `category` | String (VarChar 50) | Not Null | Nhóm phân loại: `SOURCE`, `METHOD`, `SKILL`, v.v. |
| `created_at` | DateTime | Default: `now()` | Thời gian tạo |
| `updated_at` | DateTime | Default: `now()`, `@updatedAt` | Thời gian cập nhật |

**Mối quan hệ**:
- Nhiều-Nhiều với `lms_questions` qua bảng trung gian `lms_questions_tags`.

---

## Bảng liên kết trung gian (Junction Tables)

### 1. Topic Questions (`lms_topics_questions`)
| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|------------|--------------|-----------|-------|
| `topic_id` | BigInt | Primary Key, Foreign Key | ID của chủ đề |
| `question_id` | BigInt | Primary Key, Foreign Key | ID của câu hỏi |
| `created_at` | DateTime | Not Null | Thời điểm gán chủ đề |
| `updated_at` | DateTime | Not Null | Thời điểm cập nhật |

### 2. Question Tags (`lms_questions_tags`)
| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|------------|--------------|-----------|-------|
| `question_id` | BigInt | Primary Key, Foreign Key | ID của câu hỏi |
| `tag_id` | BigInt | Primary Key, Foreign Key | ID của thẻ tag |
| `created_at` | DateTime | Default: `now()` | Thời điểm gắn thẻ tag |
