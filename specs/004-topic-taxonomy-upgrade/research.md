# Research Report: Kiến Trúc Phân Cấp Học Thuật (Taxonomy & Tagging)

## 1. Quyết định thiết kế Materialized Path cho `lms_topics`

### Lựa chọn thiết kế
* Lưu trữ một thuộc tính `parent_id` kiểu `BigInt` tự tham chiếu tới chính `id` của `lms_topics`.
* Lưu trữ một thuộc tính `path` kiểu `String` dạng `VARCHAR(512)` để chứa materialized path (ví dụ: `1/3/12/`).
* Cấp cao nhất (Gốc - Root) sẽ có `parent_id = NULL` và `path = {id}/`.

### Giải thuật cập nhật materialized path khi di chuyển Node
Khi một Node thay đổi `parent_id` từ `old_parent` sang `new_parent`:
1. Tính toán `path` mới của Node: `new_path = new_parent.path + id + '/'`. (Nếu `new_parent` là NULL thì `new_path = id + '/'`).
2. Tìm tất cả các Node con cháu (descendants) của Node hiện tại dựa trên `path` cũ:
   ```sql
   SELECT id, path FROM lms_topics WHERE path LIKE 'old_path%';
   ```
3. Cập nhật `path` của Node hiện tại và toàn bộ con cháu của nó bằng cách thay thế phần tiền tố `old_path` bằng `new_path` mới:
   ```typescript
   const updatedPath = child.path.replace(oldPath, newPath);
   ```

## 2. Thiết kế Tagging đa chiều cho câu hỏi

### Lựa chọn thiết kế
* Tạo bảng `lms_tags` chứa thông tin thẻ tag.
* Tạo bảng liên kết Nhiều-Nhiều `lms_questions_tags` để map `question_id` và `tag_id`.
* Prisma hỗ trợ liên kết Nhiều-Nhiều ngầm định (Implicit Many-to-Many Relations) hoặc tường minh (Explicit). Ở đây chúng ta chọn **Explicit Many-to-Many** để dễ dàng thêm các metadata (ví dụ người tạo tag, ngày tạo) nếu cần và kiểm soát schema SQL chuẩn xác hơn.

## 3. Các giải pháp thay thế đã cân nhắc

* **Cân nhắc 1: Dùng Nested Set Model**
  * *Lý do loại bỏ:* Quá phức tạp khi ghi dữ liệu (phải update `lft` và `rgt` của toàn bộ các node khác bên phải cây). Cực kỳ dễ gây deadlock khi có nhiều transaction ghi đồng thời.
* **Cân nhắc 2: Chỉ dùng Adjacency List (`parent_id`)**
  * *Lý do loại bỏ:* Khi query lấy toàn bộ con cháu (ví dụ: lấy mọi câu hỏi của một Syllabus), phải dùng đệ quy CTE. Với MySQL 8.0, CTE chạy được nhưng câu lệnh SQL sẽ phức tạp và kém tối ưu khi lượng câu hỏi và học sinh truy cập tăng cao. Materialized Path tối giản hóa câu lệnh lọc thành một phép so khớp chuỗi `LIKE 'prefix/%'` cực nhanh.
