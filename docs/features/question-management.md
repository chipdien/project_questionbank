# 📔 Quản lý ngân hàng câu hỏi

Hướng dẫn chi tiết về cách quản lý câu hỏi và tạo bộ sưu tập chuyên đề.

---

## 🏛️ Ngân hàng dữ liệu câu hỏi (Question Bank)

Toàn bộ các câu hỏi trích xuất được lưu trữ tập trung trong cơ sở dữ liệu MySQL. Bạn có thể quản lý chúng thông qua:

### 1. Giao diện bảng dữ liệu (Data Grid Interface)
- **Tìm kiếm & Lọc**: Tìm nhanh câu hỏi theo nội dung hoặc thẻ gắn kèm.
- **Chế độ chọn (Selection Mode)**: Tích chọn nhiều câu hỏi cùng lúc bằng checkbox.
- **Hành động (Actions)**: Xem chi tiết câu hỏi, chỉnh sửa nội dung hoặc đưa vào bộ sưu tập.

---

## 📂 Bộ sưu tập (Collections)

Bộ sưu tập câu hỏi là tập hợp các câu hỏi được phân loại theo chủ đề, kỳ thi hoặc theo giáo viên sở hữu.

### 🌟 Các tính năng chính:
- **Phân nhóm chuyên đề**: Giúp tổ chức câu hỏi một cách khoa học.
- **Thêm hàng loạt (Bulk Addition)**: Chọn nhiều câu hỏi cùng lúc từ bảng chính và đưa vào bộ sưu tập hiện có hoặc mới.

---

## 🧩 Modals & Tương tác UI

- **`QuestionModal`**: Cửa sổ để xem hoặc điều chỉnh mã LaTeX thô và các metadata trước khi xác nhận lưu.
- **`AddToCollectionModal`**: Giao diện đơn giản để nhập tên bộ sưu tập và gán danh sách ID câu hỏi đã chọn.

---
*Truy cập `docs/api/endpoints.md` để xem tích hợp kỹ thuật.*
