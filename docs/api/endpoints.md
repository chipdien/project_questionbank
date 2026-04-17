# 📡 Danh sách API & Server Actions

Tài liệu chi tiết về các endpoint RESTful và các thao tác phía server của **Project Question Bank**.

---

## 1. API Routes

### `POST /api/convert`
Tiếp nhận file tải lên và chuyển đổi.

- **Mô tả**: Chấp nhận các định dạng `.pdf`, `.docx`, `.png`, `.jpg`. Sử dụng Mathpix và Gemini để trích xuất câu hỏi.
- **Xử lý trùng lặp**:
    - Nếu trùng hash của cùng user: Trả về 200 kèm `documentId` cũ (không trích xuất lại).
    - Nếu trùng hash của user khác đang đặt là `Public`: Trả lại lỗi `409 Conflict` kèm thông báo và `publicDocumentId` để client tự động redirect đến bản công khai đó.
    - Nếu trùng hash của user khác nhưng là `Private`: Bỏ qua việc kiểm tra trùng lặp và thực hiện trích xuất, upload thành một tài liệu hoàn toàn mới độc lập.
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

## 2. API Tài liệu Custom (Document Custom)

### `POST /api/documentcustom/check-duplicate`
Kiểm tra xem file đã từng được user hiện tại tải lên chưa.

- **Request Body**: `JSON { "contentHash": "sha256_hash" }`
- **Phản hồi**: `200` kèm object `{ "isDuplicate": boolean, "duplicateTitle": string }`.

### `POST /api/documentcustom/upload-and-save`
Tải lên và lưu trữ tài liệu custom. 

- **Deduplication**:
  - Trùng file của bản thân: Báo lỗi `409 Conflict`.
  - Trùng file của user khác: Hệ thống tái sử dụng (reuse) link S3 và chỉ tạo bản ghi DB mới (Ownership-Separated Deduplication).

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
