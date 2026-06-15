# ⚠️ Project Error Log & Learning

Tài liệu này ghi lại các lỗi kỹ thuật phát hiện được trong quá trình phát triển để tránh lặp lại.

---

## [2026-04-08 13:55] - Pandoc PDF Export LaTeX Error

- **Type**: Logic / Integration
- **Severity**: High
- **File**: `src/app/api/export/pandoc/route.ts`
- **Agent**: Antigravity orchestrator (eMon)
- **Root Cause**: Pandoc không nhận diện được khối toán học nếu có khoảng trắng dư thừa ngay sau dấu `$` mở đầu hoặc trước dấu `$` kết thúc (ví dụ `$ D = R $` thay vì `$D = R$`). Khi Pandoc không nhận diện được toán học, nó Render ra LaTeX dưới dạng văn bản thuần và escape dấu `$`, dẫn đến lỗi `\mathbb` không nằm trong math mode.
- **Error Message**: 
  ```
  ! LaTeX Error: \symbballowed only in math mode.
  l.167 ....} Tập xác định của hàm số là \$D=\mathbb
  ```
- **Fix Applied**: Cập nhật `cleanMathpixData` sử dụng Regex để tự động "thắt kịp" (trim) nội dung bên trong các dấu định giới toán học `\(`, `\[`, `$`, `$$`.
- **Prevention**: Luôn đảm bảo output Markdown từ các utility hàm math-utils phải tuân thủ chuẩn nghiêm ngặt của Pandoc (Tight math delimiters).
- **Status**: Fixed

---

## [2026-04-12 15:42] - Missing variable rename in migration (rehypeMathjax -> rehypeKatex)

- **Type**: Agent
- **Severity**: Medium
- **File**: `src/app/question-bank/components/QuestionModal.tsx:134`
- **Agent**: eMon (Antigravity)
- **Root Cause**: Omission of variable rename during a global search-and-replace operation. The agent replaced the import and the first occurrence but missed the second occurrence within the same file.
- **Error Message**: 
  ```
  Uncaught ReferenceError: rehypeMathjax is not defined
  ```
- **Fix Applied**: Renamed `rehypeMathjax` to `rehypeKatex` at line 134 in `QuestionModal.tsx`.
- **Prevention**: Use global search (grep/ripgrep) AFTER migration to ensure no traces of old variables remain.
- **Status**: Fixed

---

## [2026-06-15 14:02] - Tailwind CSS v4 CSS Parsing Error due to SQL Auto-scan

- **Type**: Process / Integration
- **Severity**: High
- **File**: `src/app/globals.css:2416`
- **Agent**: eMon (Antigravity)
- **Root Cause**: Tailwind CSS v4 mặc định tự động quét toàn bộ thư mục dự án (Automatic Source Detection). Nó đã quét qua tệp SQL dump lớn trong thư mục `docs/db/` và phân tích nhầm các cú pháp toán học chứa dấu hai chấm và gạch đứng (như `:|x|` hoặc `:|-24|`) thành utility class Tailwind có tên `[-:|]`. Lớp CSS sinh ra `.-:| { -: |; }` chứa cú pháp lỗi, khiến PostCSS parser trong Next.js dev server bị crash (Error 500).
- **Error Message**: 
  ```
  Uncaught Error: ./src/app/globals.css:2416:9
  Parsing CSS source code failed
    2414 |   }
    2415 |   .\[-\:\|\] {
  > 2416 |     -: |;
         |         ^
    2417 |   }
  Unexpected token Semicolon
  ```
- **Fix Applied**: 
  1. Tắt tính năng tự động quét nguồn (Auto-scan) của Tailwind v4 bằng cách đổi `@import "tailwindcss";` thành `@import "tailwindcss" source(none);` trong `src/app/globals.css`.
  2. Chỉ cho phép Tailwind quét các thư mục quy định cụ thể thông qua `@source` (`src/app`, `src/components`, `src/lib`).
  3. Đồng thời đổi các Regex literal trong `src/lib/utils/math-utils.ts` có chứa `|` và `[]` sang `new RegExp` kết hợp nối chuỗi để ngăn chặn tuyệt đối trình quét của Tailwind trong tương lai.
- **Prevention**: Luôn tắt chế độ auto-scan của Tailwind CSS v4 trong các dự án có chứa tệp dữ liệu tĩnh lớn (như SQL dump, tài liệu md) bằng cách sử dụng `source(none)` và định cấu hình `@source` rõ ràng cho các thư mục frontend.
- **Status**: Fixed

---
