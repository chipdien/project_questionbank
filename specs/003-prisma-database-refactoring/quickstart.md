# Quickstart & Verification Guide: Prisma Database Connection

**Feature**: [spec.md](./spec.md)

Tài liệu này hướng dẫn cách kiểm tra và xác nhận hệ thống hoạt động chính xác sau khi hoàn thành tái cấu trúc kết nối Prisma.

## 1. Chuẩn bị Môi trường (Prerequisites)

1. Đảm bảo biến môi trường `DATABASE_URL` trong tệp `.env` hoặc `.env.local` đã được cấu hình chính xác và trỏ tới cơ sở dữ liệu MySQL của bạn.
   Ví dụ:
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/vietelite_qb"
   ```
2. Sinh Prisma Client cục bộ:
   ```bash
   npm run prisma:generate
   ```

---

## 2. Các kịch bản xác minh (Verification Scenarios)

### Kịch bản 1: Quản lý độ khó (CRUD Difficulties)
1. Khởi động môi trường phát triển: `npm run dev`.
2. Truy cập vào trang ngân hàng câu hỏi `/question-bank` (hoặc UI quản lý cấu hình).
3. Thực hiện thêm mới một độ khó (ví dụ: "Cực khó", màu "#ff0000").
4. Cập nhật tên độ khó vừa tạo hoặc thay đổi thứ tự hiển thị.
5. Xóa độ khó đó và chọn một độ khó khác để thay thế các câu hỏi liên kết.
6. **Kết quả mong đợi**: Không xảy ra lỗi hiển thị, dữ liệu trong bảng CSDL `lms_difficulties` cập nhật chính xác.

### Kịch bản 2: Ingest tài liệu và bóc tách câu hỏi (Document Ingest Flow)
1. Đăng nhập vào hệ thống và truy cập trang tải lên tài liệu.
2. Tải lên một file `.docx` hoặc `.pdf` hợp lệ.
3. Chờ tiến trình AI hoàn thành việc bóc tách câu hỏi và lưu vào CSDL.
4. **Kết quả mong đợi**:
   - Tệp tin được xử lý thành công, status của task chuyển sang `COMPLETED`.
   - Một bản ghi document mới được tạo trong `lms_documents`.
   - Các câu hỏi và đáp án lựa chọn tương ứng được tạo chính xác trong `lms_questions` và `lms_options`.
   - Bảng trung gian `lms_questions_documents` được tạo đầy đủ liên kết.
   - Nếu xảy ra lỗi phân tích giữa chừng, toàn bộ transaction của tài liệu đó phải được rollback sạch sẽ.

### Kịch bản 3: Serialization BigInt
1. Đảm bảo mọi API và Server Actions trả dữ liệu chứa khóa chính của tài liệu (`BigInt`) đều chạy trơn tru mà không làm sập giao diện Next.js.
2. **Kết quả mong đợi**: Không xuất hiện lỗi `TypeError: Do not know how to serialize a BigInt` ở console hay màn hình UI.
