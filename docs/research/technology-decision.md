# 🧭 Quyết định công nghệ (Technology Decisions)

Lý do đằng sau các lựa chọn kiến trúc cốt lõi và thư viện sử dụng.

---

## 🏗️ Framework cốt lõi: Next.js 16

Next.js được lựa chọn nhờ khả năng hỗ trợ full-stack hoàn hảo.

- **App Router**: Tối ưu hóa điều hướng và tạo API dễ dàng hơn.
- **Server Actions**: Đơn giản hóa việc tích hợp giữa frontend và backend.
- **React 19 Hooks**: Nâng cao khả năng quản lý trạng thái cho các giao diện UI phức tạp.

---

## 💾 Cơ sở dữ liệu: MySQL

Một cơ sở dữ liệu quan hệ là điều cần thiết để đại diện cho các mối quan hệ phức tạp giữa câu hỏi, tài liệu và các phương án trả lời.

- **Hiệu suất**: Độ tin cậy cao cho dữ liệu dạng giao dịch.
- **Khả năng mở rộng**: Có thể xử lý các ngân hàng câu hỏi quy mô lớn.

---

## 🧠 AI: Google Gemini 1.5/2.0

Gemini nổi bật nhờ khả năng lập luận cao và hiểu biết sâu sắc về Toán học.

- **Hỗ trợ LaTeX**: Gemini định dạng và xác thực cú pháp LaTeX một cách chính xác.
- **Hỗ trợ Thị giác (Vision)**: Hỗ trợ trích xuất câu hỏi trực tiếp từ ảnh chụp thông qua đầu vào đa phương thức.

---

## 📐 OCR mạnh mẽ: Mathpix API

Mathpix là chuẩn mực công nghiệp cho việc nhận diện ký tự quang học (OCR) toán học.

- **Tập trung vào Toán học**: Độ chính xác vượt trội cho các phân số phức tạp, tích phân và các ký pháp khoa học.
- **Xuất dữ liệu Markdown**: Đầu ra trực tiếp dưới dạng Markdown/LaTeX giúp tích hợp mượt mà vào dự án.

---
*Truy cập `docs/architecture/architecture.md` để xem sơ đồ kiến trúc hệ thống.*
