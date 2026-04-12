/**
 * Cleans Mathpix data for rendering.
 * - Converts math delimiters to standard $ and $$
 * - Removes extra whitespace and newlines inside math blocks
 * - Handles escaped backslashes if present
 * - Ensures tight delimiters for Pandoc compatibility
 */
export const cleanMathpixData = (text: string | null | undefined): string => {
  if (!text) return 'N/A';

  // 1. Bước quan trọng nhất: Khử double-escape từ database/JSON
  // Sử dụng regex có điều kiện để chỉ khử dấu \ khi theo sau là chữ cái hoặc ký hiệu lệnh
  // (ví dụ: \\mathrm -> \mathrm, \\| -> \|). 
  // Tránh việc biến các lệnh xuống dòng (\\) thành (\).
  let cleaned = text.replace(/\\\\(?=[a-zA-Z|(){}\[\]%])/g, '\\');

  cleaned = cleaned
    // 2. Chuyển đổi Block Math: \[ ... \] hoặc \\ [ ... \\ ] về $$ ... $$
    // Lưu ý: Sau bước replace \\ -> \ ở trên, các delimiter này sẽ là \[ và \]
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$$1$$$$')
    // 3. Chuyển đổi Inline Math: \( ... \) về $ ... $
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$$')
    // 4. Chuẩn hóa các dấu $$ ... $$ hiện có (đảm bảo không bị dính chữ hoặc khoảng trắng thừa)
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '$$$$$1$$$$')
    // 5. Thắt chặt dấu $ đơn cho Inline Math 
    // Đảm bảo không có khoảng trắng sát dấu $ (ví dụ: "$ x $" -> "$x$")
    .replace(/(?<!\$)\$\s*([^\$\n]+?)\s*\$(?!\$)/g, '$$$1$$')
    // 6. Xử lý khoảng trắng đặc thù của Mathpix (như dính chữ \mathrm{cm} dính vào số)
    // Nhưng chủ yếu việc sửa lỗi double-escape ở bước 1 đã giải quyết phần lớn vấn đề hiển thị.
    .replace(/\r\n/g, '\n')
    .trim();

  return cleaned;
};
