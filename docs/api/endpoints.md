# 📡 Danh sách API & Server Actions

Tài liệu chi tiết về các endpoint RESTful và các thao tác phía server của **Project Question Bank**.

---

## 1. API Routes

### `POST /api/convert`
Tiếp nhận file tải lên và chuyển đổi.

- **Mô tả**: Chấp nhận các định dạng `.pdf`, `.png`, `.jpg`. Sử dụng Mathpix và Gemini để trích xuất câu hỏi.
- **Request Body (Nội dung yêu cầu)**: `multipart/form-data`
  - `document`: File nhị phân cần trích xuất.
- **Phản hồi thành công (200)**:
  ```json
  {
    "success": true,
    "data": {
      "text": "Chuỗi văn bản thô đã trích xuất...",
      "documentId": 123,
      "questionsCount": 10
    }
  }
  ```

### `GET /api/documents/[id]/questions`
Lấy danh sách các câu hỏi liên kết với một tài liệu cụ thể.

- **Tham số đường dẫn (Path Parameters)**: `id` - ID của tài liệu.
- **Phản hồi (Response)**: Danh sách các câu hỏi có cấu trúc.

---

## 2. Server Actions (`src/app/actions`)

Các thao tác thực hiện trực tiếp phía máy chủ để tương tác với cơ sở dữ liệu.

### `createCollectionAction(title, selectedIds)`
Tạo mới một bộ sưu tập câu hỏi.

- **Tham số đầu vào (Inputs)**:
  - `title`: Tên bộ sưu tập.
  - `selectedIds`: Mảng chứa các ID câu hỏi được chọn.
- **Thao tác (Operations)**: Chèn bản ghi vào bảng `lms_collections` và `lms_questions_collections`.

### `getCollectionsAction()`
Lấy danh sách tất cả các bộ sưu tập hiện có kèm theo số lượng.

---
*Truy cập thư mục `docs/api/examples/` để xem các file JSON mẫu.*
