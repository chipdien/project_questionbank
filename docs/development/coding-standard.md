# 🛠️ Quy chuẩn lập trình (Coding Standards)

Hướng dẫn duy trì chất lượng mã nguồn cho toàn bộ dự án **Project Question Bank**.

---

## 🏗️ Quy tắc đặt tên (Naming Conventions)

- **Tệp / Thư mục (Files/Dirs)**: Sử dụng `kebab-case` cho tên viết thường và `PascalCase` cho các React Component.
  - *Ví dụ*: `questions-grid.tsx` hoặc `Sidebar.tsx`.
- **Biến / Tham số (Variables/Params)**: Sử dụng `camelCase`.
  - *Ví dụ*: `const questionCount = 0;`.
- **Hàm / Phương thức (Functions/Methods)**: Sử dụng `camelCase`.
  - *Ví dụ*: `function fetchData() { ... }`.
- **Hằng số (Constants)**: Sử dụng `UPPER_SNAKE_CASE`.
  - *Ví dụ*: `const MAX_FILE_SIZE = 100 * 1024;`.

---

## 🧩 Chuẩn TypeScript (TypeScript Standards)

- **Strict Mode**: Luôn giữ `strict: true` trong `tsconfig.json`.
- **Typing**: Hạn chế sử dụng kiểu `any`, ưu tiên xác định kiểu rõ ràng.
- **Interfaces**: Định nghĩa Interface cho các cấu trúc dữ liệu API và props của component.

---

## ⚛️ Quy trình React (React Best Practices)

- **Functional Components**: Sử dụng arrow functions và React Hooks.
- **Phân tách trách nhiệm (Separation of Concerns)**: Giữ các logic (API/xử lý trạng thái) tách biệt với giao diện (UI) nếu có thể.
- **Server Actions**: Sử dụng `'use server'` cho các thao tác phía máy chủ một cách chính xác.

---

## 🧹 Chất lượng mã nguồn (Code Quality)

- **Linting**: Đảm bảo `npm run lint` không bị lỗi trước khi tiến hành commit.
- **Định dạng (Formatting)**: Sử dụng Prettier để giữ cho các dòng mã nhất quán.
- **Chú thích (Comments)**: Viết các chú thích rõ ràng bằng Tiếng Anh cho các logic phức tạp. 
  - *Lưu ý*: Tài liệu hướng dẫn sử dụng Tiếng Việt, nhưng chú thích trong code nên ưu tiên Tiếng Anh.

---
*Truy cập `docs/architecture/architecture.md` để xem chi tiết kiến trúc.*
