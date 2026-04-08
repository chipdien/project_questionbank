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
- **Fix Applied**: Cập nhật `cleanMathpixData` sử dụng Regex để tự động "thắt chặt" (trim) nội dung bên trong các dấu định giới toán học `\(`, `\[`, `$`, `$$`.
- **Prevention**: Luôn đảm bảo output Markdown từ các utility hàm math-utils phải tuân thủ chuẩn nghiêm ngặt của Pandoc (Tight math delimiters).
- **Status**: Fixed

---
