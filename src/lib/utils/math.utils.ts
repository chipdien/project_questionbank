/**
 * Sửa lỗi mọi loại bảng Markdown bị "nén" trên một dòng và tự động thêm mũi tên cho bảng biến thiên.
 */
const fixMarkdownTable = (text: string): string => {
  // 1. Tìm tất cả các hàng separator tiềm năng để xác định ranh giới bảng
  const separatorRegex = new RegExp('\\|' + '(?:\\s*[:\\-]+\\s*\\|){2,}', 'g');
  let result = text;

  // Dùng loop để tìm và sửa từng bảng trong văn bản
  let match;
  while ((match = separatorRegex.exec(result)) !== null) {
    const separatorRow = match[0];
    const pipesPerRow = (separatorRow.match(/\|/g) || []).length;
    const cols = pipesPerRow - 1;

    // Tìm ranh giới khối văn bản dính liền quanh hàng separator
    let blockStart = match.index;
    while (blockStart > 0 && result[blockStart - 1] !== '\n') blockStart--;
    let blockEnd = match.index + separatorRow.length;
    while (blockEnd < result.length && result[blockEnd] !== '\n') blockEnd++;

    const blockContent = result.substring(blockStart, blockEnd);

    // Nếu khối này không có newline (bảng bị nén)
    if (!blockContent.includes('\n')) {
      const allParts = blockContent.split('|').map(c => c.trim());

      // Tìm vị trí hàng separator trong danh sách các cell
      const sepParts = separatorRow.split('|').map(c => c.trim()).filter(c => c !== '');
      let sepIdx = -1;
      for (let i = 0; i <= allParts.length - sepParts.length; i++) {
        if (allParts[i] === sepParts[0] && allParts[i + 1] === sepParts[1]) {
          sepIdx = i;
          break;
        }
      }

      if (sepIdx >= cols) {
        // Tách văn bản trước bảng, nội dung bảng, và văn bản sau bảng
        const textBeforeTable = allParts.slice(0, sepIdx - cols).join(' | ').trim();
        const tableAllParts = allParts.slice(sepIdx - cols);

        let rebuiltLines: string[] = [];
        let currentLineParts: string[] = [];
        let usedPartsCount = 0;

        for (let i = 0; i < tableAllParts.length; i++) {
          currentLineParts.push(tableAllParts[i]);
          usedPartsCount++;

          if (currentLineParts.length === cols) {
            rebuiltLines.push('| ' + currentLineParts.join(' | ') + ' |');
            currentLineParts = [];
            usedPartsCount++; // tính cả dấu pipe phân tách hàng
            if (tableAllParts[i + 1] === '') i++;
          }

          // Kiểm tra nếu phần tiếp theo không còn là cấu trúc bảng (sau khi đã có đủ hàng)
          // Hoặc nếu đây là hàng cuối cùng có thể có của bảng
        }

        // Nếu vẫn còn phần dư (văn bản sau bảng)
        const textAfterTable = currentLineParts.join(' | ').trim();

        // Xây dựng lại bảng biến thiên nếu cần (Arrow logic)
        const signsIdx = rebuiltLines.findIndex(l => l.includes('f\'') || l.includes('f^{\\prime}'));
        const fIdx = rebuiltLines.findIndex(l => l.includes('f(x)'));
        if (signsIdx !== -1 && fIdx !== -1 && fIdx > signsIdx && (fIdx - signsIdx <= 2)) {
          const signsRow = rebuiltLines[signsIdx];
          const parts = signsRow.split('|').map(p => p.trim());
          const arrowParts = parts.map((p, idx) => {
            if (idx === 0 || idx === parts.length - 1) return '';
            if (idx === 1) return ' ';
            if (p.includes('-') && p.includes('$')) return ' $\\searrow$ ';
            if (p.includes('+') && p.includes('$')) return ' $\\nearrow$ ';
            return ' ';
          });
          const arrowRow = arrowParts.join('|').trim();
          if (arrowRow.includes('\\searrow') || arrowRow.includes('\\nearrow')) {
            rebuiltLines.splice(fIdx, 0, arrowRow);
          }
        }

        const finalContent = (textBeforeTable ? textBeforeTable + '\n\n' : '') +
          rebuiltLines.join('\n') +
          (textAfterTable ? '\n\n' + textAfterTable : '');

        result = result.substring(0, blockStart) + finalContent + result.substring(blockEnd);
        separatorRegex.lastIndex = blockStart + finalContent.length;
      }
    }
  }

  // 3. Chuẩn hóa ký hiệu toán học bên trong bảng
  result = result.replace(new RegExp('\\|\\s*([^|' + '$\\n]+?)\\s*(?=\\|)', 'g'), (match, content) => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.includes('$')) return match;

    const isMathSymbol =
      /^[-+]?\d+(\.\d+)?$/.test(trimmed) ||
      /^[-+]$/.test(trimmed) ||
      /^[+\-]?\\infty$/.test(trimmed) ||
      /^[a-zA-Z]$/.test(trimmed) ||
      /^f['′]\(x\)$/.test(trimmed) ||
      /^f['′]\(-?\d+\)$/.test(trimmed) ||
      /^\[.*\)$/.test(trimmed) || // Hỗ trợ khoảng như [20; 25)
      trimmed === '0';

    if (isMathSymbol) {
      return `| $${trimmed}$ `;
    }
    return match;
  });

  return result;
};

/**
 * Cleans Mathpix data for rendering.
 * - Converts math delimiters to standard $ and $$
 * - Removes extra whitespace and newlines inside math blocks
 * - Handles escaped backslashes if present
 * - Ensures tight delimiters for Pandoc compatibility
 */
export const cleanMathpixData = (text: string | null | undefined): string => {
  if (!text) return 'N/A';

  // 0. Thay thế các ảnh Mathpix CDN cũ đã hết hạn (không di cư được sang S3) bằng ghi chú thay vì để lỗi 404
  const expiredMarkdownImageRegex = /!\[.*?\]\(https?:\/\/(images|cdn)\.mathpix\.com\/[^\s\)\]\"\'\>\`]+\)/g;
  const expiredHtmlImageRegex = /<img[^>]+src=["']https?:\/\/(images|cdn)\.mathpix\.com\/[^"']+["'][^>]*>/gi;

  // Ảnh đã di cư sang S3 được lưu dưới dạng URL public trực tiếp
  // (bucket cho phép đọc công khai) nên render thẳng, không qua proxy.
  let cleaned = text
    .replace(expiredMarkdownImageRegex, '*(Hình ảnh đã hết hạn)*')
    .replace(expiredHtmlImageRegex, '*(Hình ảnh đã hết hạn)*');

  // 1. Bước quan trọng nhất: Khử double-escape từ database/JSON
  // Sử dụng regex có điều kiện để chỉ khử dấu \ khi theo sau là chữ cái hoặc ký hiệu lệnh
  cleaned = cleaned.replace(new RegExp('\\\\\\\\(?=[a-zA-Z' + '|(){}\\[\\]%′\'])', 'g'), '\\');

  // 2. Xử lý bảng Markdown trước khi xử lý Math (để tránh làm hỏng cấu trúc pipe)
  cleaned = fixMarkdownTable(cleaned);

  cleaned = cleaned
    // 3. Chuyển đổi Block Math: \[ ... \] hoặc \\ [ ... \\ ] về $$ ... $$
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$$1$$$$')
    // 4. Chuyển đổi Inline Math: \( ... \) về $ ... $
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$$')
    // 5. Chuẩn hóa các dấu $$ ... $$ hiện có
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '$$$$$1$$$$')
    // 6. Thắt chặt dấu $ đơn cho Inline Math 
    .replace(/(?<!\$)\$\s*([^\$\n]+?)\s*\$(?!\$)/g, '$$$1$$')
    .replace(/\r\n/g, '\n')
    .trim();

  return cleaned;
};

/**
 * Kết hợp statement và content của câu hỏi một cách thông minh để hiển thị.
 */
export const getQuestionDisplayContent = (
  statement: string | null | undefined,
  content: string | null | undefined
): string => {
  const cleanStmt = statement?.trim() || '';
  const cleanContent = content?.trim() || '';

  // Nếu statement rỗng hoặc chỉ là chỉ số tạm "1", ta hiển thị content
  if (!cleanStmt || cleanStmt === '1') {
    return cleanContent;
  }

  // Nếu content rỗng hoặc chỉ là ký tự đặc biệt như dấu chấm, ta hiển thị statement
  if (!cleanContent || cleanContent === '.') {
    return cleanStmt;
  }

  // Nếu hai cột giống hệt nhau
  if (cleanStmt === cleanContent) {
    return cleanStmt;
  }

  // Kết hợp cả hai khi cả hai đều hợp lệ và khác nhau
  return `${cleanStmt}\n\n${cleanContent}`;
};

