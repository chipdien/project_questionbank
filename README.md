# 📚 Project Question Bank

Hệ thống quản lý ngân hàng câu hỏi thông minh hỗ trợ bởi AI (Mathpix, Gemini & KaTeX).

---

## 🛠️ Công nghệ cốt lõi (Core Tech)

- **Frontend**: Next.js 16 (App Router), Tailwind CSS 4.
- **Render toán học**: **KaTeX** (Tốc độ cao, hỗ trợ SSR).
- **AI & OCR**: Google Gemini API, Mathpix API.
- **Backend**: Next.js Server Actions, MySQL.

---

## 📖 Tài liệu (Documentation)

Bạn đang tìm kiếm hướng dẫn? Hãy truy cập bộ tài liệu chuyên sâu của dự án tại thư mục `docs/`:

- **Kiến trúc hệ thống (Architecture)**: [architecture.md](docs/architecture/architecture.md)
- **Danh sách API Endpoints**: [endpoints.md](docs/api/endpoints.md)
- **Hướng dẫn cài đặt (Local Setup)**: [setup.md](docs/development/setup.md)
- **Quy chuẩn lập trình (Coding Standards)**: [coding-standard.md](docs/development/coding-standard.md)
- **Công nghệ AI (AI Ingestion)**: [ai-ingestion.md](docs/features/ai-ingestion.md)
- **Phân loại AI (AI Classification)**: [ai-classification.md](docs/features/ai-classification.md)
- **Quản lý Bộ sưu tập (Collection)**: [collection-management.md](docs/features/collection-management.md)
- **Lịch sử Database (DB Schema)**: [schema_history.md](docs/db/schema_history.md)
- **Nghiên cứu & Quyết định (Research)**: [technology-decision.md](docs/research/technology-decision.md)
- **Xuất PDF & Lịch sử (Custom Documents)**: [docs/features/custom-documents.md](docs/features/custom-documents.md)

---

## ⚠️ CẢNH BÁO AN TOÀN DATABASE (DATABASE SAFETY)

> [!CAUTION]
> **Cơ sở dữ liệu đang có dữ liệu thực tế (production).**
> * **TUYỆT ĐỐI KHÔNG** chạy các lệnh phá hủy dữ liệu như `npx prisma migrate reset` hoặc `npx prisma db push --force-reset`.
> * Mọi nâng cấp cấu trúc cơ sở dữ liệu trên production phải được triển khai thông qua các file SQL migration an toàn bằng lệnh:
>   `npx prisma migrate deploy`
> * Tham khảo thêm tài liệu chi tiết tại [prisma/README.md](prisma/README.md).

---

## 🏗️ Bắt đầu nhanh (Quick Start)

Dành cho nhà phát triển muốn chạy thử nghiệm cục bộ:

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy server phát triển
npm run dev
```

## 🏷️ Cấu trúc phân cấp học thuật & Thẻ tag (Taxonomy & Tagging API)

Hệ thống hỗ trợ cấu trúc phân cấp đệ quy chủ đề học thuật không giới hạn cấp độ thông qua giải thuật **Materialized Path** kết hợp với hệ thống **Tagging** đa chiều giúp phân loại và lọc câu hỏi hiệu quả.

### Các API mới cung cấp:
- **Quản lý chủ đề đệ quy (Topics)**:
  - `GET /api/topics`: Lấy cây chủ đề đệ quy (có hỗ trợ lọc nhánh con cháu bằng tham số `rootPath`).
  - `POST /api/topics`: Tạo mới một chủ đề học tập (tự động tính toán materialized path).
  - `PATCH /api/topics/[id]`: Cập nhật thông tin chủ đề (tự động cập nhật đệ quy toàn bộ đường dẫn của nhánh con cháu khi di chuyển node cha).
  - `DELETE /api/topics/[id]`: Xóa chủ đề (tự động phá vỡ liên kết và dọn dẹp quan hệ con cháu).
- **Quản lý Thẻ tag (Tags)**:
  - `GET /api/tags`: Lấy danh sách tag (lọc theo `category` như `METHOD`, `SOURCE`, `SKILL`).
  - `POST /api/tags`: Tạo tag mới (tự động chuẩn hóa tên tag viết thường).
  - `POST /api/questions/[id]/tags`: Gán thẻ tag vào câu hỏi.
  - `DELETE /api/questions/[id]/tags`: Gỡ thẻ tag khỏi câu hỏi.
- **Tìm kiếm lọc câu hỏi nâng cao (Advanced Question Filter)**:
  - `GET /api/questions/search`: Tìm kiếm câu hỏi kết hợp chủ đề đệ quy và danh sách các thẻ tag cụ thể.

---
*Phát triển bởi Đội ngũ VietElite. Tài liệu được biên soạn bằng Tiếng Việt.*
