# Quickstart: Hướng dẫn Xác minh Tính năng (Validation Guide)

Tài liệu này hướng dẫn cách chạy và xác minh các tính năng thuộc Đặc tả Quản lý Giáo trình và Thẻ tag.

## Chuẩn bị (Prerequisites)

1. Đảm bảo bạn đã chuyển sang nhánh phát triển:
   ```bash
   git checkout 005-syllabus-tag-management
   ```
2. Cài đặt các thư viện phụ thuộc (nếu có):
   ```bash
   npm install
   ```
3. Chạy phát triển môi trường local:
   ```bash
   npm run dev
   ```

---

## Các kịch bản Xác minh (Validation Scenarios)

### Kịch bản 1: Quản lý Cây Chủ đề (Syllabus/Topics)

1. **Kiểm tra giao diện cây**:
   - Truy cập: `http://localhost:3000/topics`
   - Xác minh: Cây chủ đề hiển thị đầy đủ phân cấp (Syllabus ➔ Topic ➔ Lesson).
2. **Thêm mới chủ đề**:
   - Nhấp chọn một chủ đề cha, chọn "Thêm chủ đề con".
   - Nhập Tên: `Kiểm thử thực thể`, Code: `TEST-TOPIC`. Nhấp "Lưu".
   - Xác minh: Chủ đề mới xuất hiện dưới chủ đề cha được chọn.
3. **Di chuyển chủ đề**:
   - Dùng kéo thả để chuyển chủ đề vừa tạo sang một chủ đề cha khác.
   - Xác minh: API phản hồi thành công và giao diện cập nhật ngay lập tức vị trí mới của chủ đề.

### Kịch bản 2: Quản lý thẻ Tag

1. **Kiểm tra danh sách tag**:
   - Truy cập: `http://localhost:3000/tags`
   - Xác minh: Danh sách thẻ hiển thị đúng tên, nhóm category.
2. **Tạo tag trùng tên**:
   - Thử tạo một tag mới trùng tên với tag đã có (ví dụ: `Toán tư duy`).
   - Xác minh: Hệ thống hiển thị cảnh báo lỗi "Tag name already exists" và ngăn không cho tạo.

### Kịch bản 3: Ngăn chặn xóa chủ đề & Chuyển đổi câu hỏi hàng loạt (Option A)

1. **Thử xóa chủ đề có liên kết**:
   - Chọn một chủ đề đang có câu hỏi hoặc đang chứa chủ đề con, nhấp nút "Xóa".
   - Xác minh:
     - Hệ thống hiển thị popup cảnh báo: "Không thể xóa chủ đề vì có câu hỏi hoặc chủ đề con liên quan".
     - Popup hiển thị danh sách các câu hỏi liên kết kèm tùy chọn chọn chủ đề đích để chuyển đổi.
2. **Chuyển đổi câu hỏi**:
   - Chọn chủ đề đích thay thế trong danh sách gợi ý.
   - Nhấp "Chuyển đổi câu hỏi".
   - Xác minh: Các câu hỏi đã được cập nhật sang chủ đề đích mới và chủ đề cũ lúc này có thể được xóa an toàn.

---

## Kiểm thử tự động (Automated Verification)

Chúng ta có thể chạy script kiểm thử logic chặn xóa và chuyển đổi câu hỏi bằng lệnh:
```bash
npx tsx tests/test-delete-restrictions.ts
```
*(Yêu cầu tạo tệp kịch bản kiểm thử tương ứng dưới thư mục `tests/` để giả lập các cuộc gọi API và truy vấn DB).*
