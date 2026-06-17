# Quickstart & Verification: Trang Danh sách Câu hỏi

**Feature**: `010-page-list` | **Date**: 2026-06-17

## Chạy thử

```bash
# Tại thư mục gốc project
npm run dev
# Truy cập http://localhost:3000/question-list
```

Đăng nhập bằng tài khoản non-admin và admin để kiểm tra phân quyền.

## Kịch bản xác thực thủ công

### 1. Hiển thị & phân trang
- [ ] Mở `/question-list` → bảng hiển thị tối đa 50 câu/trang, sắp xếp mới nhất trước.
- [ ] Thanh phân trang hiển thị đúng tổng số & số trang; chuyển trang hoạt động đúng.
- [ ] Mỗi dòng có đủ cột: ID, Nội dung, Khối lớp, Độ khó (badge màu), Hình thức, Chủ đề, Tags, Người tạo, Ngày tạo, Trạng thái phân loại, nút "Xem chi tiết".

### 2. Phân quyền
- [ ] Non-admin: không thấy câu private (`public='0'`) của người khác; vẫn thấy câu `public='1'`, null, và câu của mình.
- [ ] Admin: thấy tất cả, kể cả private.

### 3. Bộ lọc
- [ ] Lọc Khối lớp → chỉ còn câu đúng khối.
- [ ] Lọc Hình thức câu hỏi → chỉ còn đúng `question_type`.
- [ ] Chọn chủ đề cha → hiển thị cả câu của chủ đề con cháu (kiểm tra theo `path`).
- [ ] Chọn nhiều tag khác category → AND giữa category, OR trong cùng category.
- [ ] Toggle "Chỉ hiện chưa phân loại" → chỉ còn câu thiếu chủ đề HOẶC thiếu tag.
- [ ] Đổi bất kỳ filter nào → phân trang reset về trang 1, tổng số cập nhật.
- [ ] Nút "Xóa bộ lọc" → về trạng thái mặc định.

### 4. Tìm kiếm
- [ ] Gõ từ khóa → debounce rồi lọc theo `statement`/`content`, kết hợp với filter đang chọn.

### 5. Xem chi tiết
- [ ] Bấm "Xem chi tiết" → `QuestionModal` mở read-only, nội dung & đáp án đầy đủ, không có nút sửa.

### 6. URL state
- [ ] Áp dụng vài bộ lọc → URL cập nhật query params.
- [ ] Tải lại trang → bộ lọc & trang khôi phục đúng.
- [ ] Copy URL sang tab mới → cùng kết quả.

### 7. Edge cases
- [ ] Bộ lọc không khớp → empty state + nút "Xóa bộ lọc".
- [ ] Câu hỏi chùm: chỉ thấy câu cha trong danh sách; câu con gộp trong chi tiết.

### 8. Điều hướng
- [ ] Sidebar: "Xử lý tài liệu" có mục con "Danh sách câu hỏi"; submenu tự mở khi ở `/question-list`.

## Kiểm tra hồi quy
- [ ] Trang `/question-bank` vẫn hoạt động bình thường (không bị ảnh hưởng bởi action/helper mới).
- [ ] `getLibraryQuestions` không bị thay đổi hành vi.
