# Tài liệu Chức năng: Xuất PDF & Quản lý Lịch sử (Custom Documents)

Tài liệu này hướng dẫn về hệ thống xuất file PDF server-side và quản lý lịch sử tài liệu trong ứng dụng.

## 1. Tổng quan quy trình (Pipeline)

Quy trình xuất PDF đã được chuyển dịch hoàn toàn sang Server-side để khắc phục các vấn đề về CORS và bảo mật khi làm việc với AWS S3.

**Sơ đồ luồng:**
1. **Frontend:** Người dùng click "Xuất PDF & Lưu" -> Nhập tiêu đề.
2. **Frontend:** Chuyển đổi các khối soạn thảo (blocks) thành Markdown.
3. **Backend (`/api/export/pandoc`):** Nhận Markdown, sử dụng Pandoc và XeLaTeX để render ra file PDF chất lượng cao.
4. **Frontend:** Gửi PDF Blob và danh sách Question IDs tới API gộp.
5. **Backend (`/api/documentcustom/upload-and-save`):**
   - Kiểm tra giới hạn dung lượng (10MB).
   - Upload file trực tiếp lên S3 từ server bằng API Key.
   - Lưu Metadata vào Database (bảng `lms_documents_custom`).
   - Lưu liên kết câu hỏi vào Database (bảng `lms_documents_custom_questions`).
6. **Frontend:** Tự động kích hoạt tải xuống file PDF cho người dùng.

## 2. Các API Routes

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/documentcustom/upload-and-save` | `POST` | Gộp bước Upload S3 và lưu Database (Server-side). |
| `/api/documentcustom/list` | `GET` | Lấy danh sách tài liệu đã tạo (không kèm câu hỏi chi tiết). |
| `/api/documentcustom/detail?id={id}` | `GET` | Lấy thông tin chi tiết tài liệu và toàn bộ danh sách câu hỏi đi kèm. |

## 3. Cấu trúc Database

Hệ thống sử dụng 2 bảng riêng biệt để quản lý:

### Bảng `lms_documents_custom`
- `id`: Khóa chính.
- `title`: Tiêu đề tài liệu.
- `pdf_url`: Đường dẫn file PDF trên S3.
- `s3_object_key`: Key của object trên S3 (để quản lý/xóa sau này).
- `created_at`, `updated_at`: Thời gian tạo/cập nhật.

### Bảng `lms_documents_custom_questions`
- `id`: Khóa chính.
- `document_custom_id`: ID của tài liệu (link tới bảng trên).
- `question_id`: ID của câu hỏi (link tới `lms_questions`).
- `created_at`, `updated_at`: Thời gian lưu.
*(Lưu ý: Quan hệ được duy trì bằng code, không ép buộc Foreign Key cứng trong schema theo yêu cầu).*

## 4. Tính năng Lịch sử (Document History)

Tính năng này nằm ở thanh bên phải (Sidebar) của trang soạn thảo, cho phép:
- **Xem danh sách:** Toàn bộ lịch sử các file PDF đã export.
- **Tải lại:** Nhấn icon Download để tải file PDF cũ từ S3.
- **Mở lại trong Editor (Re-open):** 
  - Khi nhấn "Mở trong Editor", hệ thống sẽ truy vấn toàn bộ câu hỏi của tài liệu đó.
  - Sau đó tự động đổ lại vào trình soạn thảo bên trái.
  - Giúp người dùng chỉnh sửa nhanh từ một bản đề thi đã có sẵn.

## 5. Cấu hình & Bảo mật

- **Giới hạn dung lượng:** Hệ thống chặn các file PDF vượt quá **10MB** ở cả Client và Server.
- **Bảo mật S3:** Việc upload thực hiện thông qua Server (Next.js) giúp bảo vệ API Key và tránh rò rỉ thông tin bucket ra frontend.
- **CORS:** Không cần cấu hình CORS Public cho bucket S3 vì mọi thao tác ghi đều thông qua server nội bộ.

---
*Tài liệu này được cập nhật vào ngày: 08/04/2026*
