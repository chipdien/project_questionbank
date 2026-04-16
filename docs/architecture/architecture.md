# 🏗️ Kiến trúc hệ thống (Architecture)

Tài liệu này mô tả kiến trúc cấp cao, danh mục công nghệ và luồng dữ liệu của dự án **Project Question Bank**.

## 📋 Tổng quan (Overview)

Project Question Bank là một nền tảng giáo dục hỗ trợ bởi AI, được thiết kế để tự động hóa quy trình trích xuất, cấu trúc hóa và quản lý các câu hỏi Toán học từ nhiều định dạng tài liệu khác nhau (PDF, Ảnh).

---

## 🛠️ Danh mục công nghệ (Tech Stack)

| Tầng / Layer | Công nghệ / Technology | Lý do chọn lựa / Rationale |
| :--- | :--- | :--- |
| **Giao diện (Frontend)** | Next.js 16, React 19 | Hiệu suất cao, App Router tối ưu hóa cho SEO và điều hướng. |
| **Định dạng (Styling)** | Tailwind CSS 4, Framer Motion | CSS linh hoạt, hỗ trợ tốt cho các chuyển động mượt mà. |
| **Render Toán học** | KaTeX | Tốc độ render cực nhanh, hỗ trợ tốt cho các công thức LaTeX phức tạp. |
| **Máy chủ (Backend)** | Next.js API Routes, Server Actions | Hợp nhất mã nguồn, thực thi phía server với độ trễ tối thiểu. |
| **Cơ sở dữ liệu (DB)** | MySQL | Lưu trữ quan hệ mạnh mẽ, tin cậy cho dữ liệu có cấu trúc. |
| **Xử lý AI** | Google Gemini 1.5/2.0 | Khả năng lập luận cao, hiểu biết sâu về ký pháp toán học. |
| **OCR / Parsing** | Mathpix API, Mammoth | Chuyên biệt cho việc trích xuất LaTeX và phân tích file Word. |

---

## 🔄 Luồng dữ liệu (Data Flow)

Sơ đồ dưới đây minh họa quy trình một tài liệu được xử lý từ lúc tải lên đến khi lưu vào cơ sở dữ liệu.

```mermaid
graph TD
    A[Người dùng tải file] --> B{Định dạng file?}
    B -- DOCX --> C[Phân tích Mammoth]
    B -- PDF/Image --> D[Nhận diện Mathpix OCR]
    C --> E[Trích xuất văn bản thô]
    D --> E
    E --> F[Băm SHA-256]
    F --> G{Đã tồn tại?}
    G -- Cùng User --> H[Trả về ID cũ]
    G -- User khác --> I[Clone Metadata & Link S3 cũ]
    G -- Mới --> K[Cấu trúc Gemini AI]
    K --> L[Upload S3 & Lưu DB]
    I --> M[Hiển thị trên DataGrid]
    L --> M
    H --> M
```

### Các bước quan trọng trong Workflow:
1.  **Tiếp nhận (Ingestion)**: File được nhận qua chuẩn `multipart/form-data` tại endpoint `/api/convert`.
2.  **Chống trùng (Deduplication)**: Hash file bằng SHA-256. Hệ thống áp dụng chiến lược **Ownership-Separated Deduplication**: Nếu file đã tồn tại trên S3 (do user khác upload), hệ thống sẽ reuse link S3 đó và chỉ tạo bản ghi Database mới để tiết kiệm tài nguyên.
3.  **Bóc tách (Parsing)**: Sử dụng Mathpix đặc biệt để đảm bảo độ chính xác cao cho các biểu thức Toán học LaTeX.
4.  **Trí tuệ nhân tạo (AI Intelligence)**: Gemini cấu trúc hóa chuỗi thô thành đối tượng JSON chứa câu hỏi, phương án và metadata.
5.  **Lưu trữ (Storage)**: 
    - **Database**: Lưu trữ quan hệ trong MySQL cho metadata và questions.
    - **Filesystem**: Lưu trữ file nhị phân raw trên **AWS S3** giúp hệ thống mở rộng linh hoạt.
6.  **Hiển thị (Rendering)**: Sử dụng KaTeX để chuyển đổi các chuỗi LaTeX thành biểu thức toán học trực quan trên giao diện người dùng.

---
*Cập nhật gần nhất: Tháng 4/2026. Biên soạn bởi eMon.*
