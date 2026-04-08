/**
 * Cleans Mathpix data for rendering.
 * - Converts math delimiters to standard $ and $$
 * - Removes extra whitespace and newlines inside math blocks
 * - Handles escaped backslashes if present
 * - Ensures tight delimiters for Pandoc compatibility
 */
export const cleanMathpixData = (text: string | null | undefined): string => {
  if (!text) return 'N/A';
  
  const cleaned = text
    .replace(/\\\\/g, '\\')         // Normalize double backslashes
    // 1. Chuyển đổi và chuẩn hóa Block Math \[ ... \] hoặc $$ ... $$
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$$1$$$$')
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '$$$$$1$$$$')
    // 2. Chuyển đổi và chuẩn hóa Inline Math \( ... \) hoặc $ ... $
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$$')
    // Thắt chặt dấu $ đơn (không áp dụng nếu là $$)
    .replace(/(?<!\$)\$\s*([^\$\n]+?)\s*\$(?!\$)/g, '$$$1$$')
    .replace(/\r\n/g, '\n')         // Normalize Windows newlines
    .trim();

  return cleaned;
};
