import { Block } from '@/app/(main)/documents/components/DocumentBuilder';
import { cleanMathpixData } from './math.utils';

function convertBbtJsonToLatex(text: string): string {
  // Regex to find ```bbt ... ``` blocks
  const bbtRegex = /```bbt\s*([\s\S]*?)\s*```/g;

  return text.replace(bbtRegex, (match, jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      const cols = data.cols || [];
      if (cols.length === 0) return '';

      const colSpec = 'c|' + 'c'.repeat(cols.length);

      // Row 1: x
      const rowX = 'x & ' + cols.map((c: any) => c.x !== undefined ? (c.x || ' ') : ' ').join(' & ');

      // Row 2: y'
      const rowYPrime = 'y\' & ' + cols.map((c: any) => {
        if (c.x !== undefined) {
          return c.y_prime === '||' ? '\\parallel' : (c.y_prime || '0');
        } else {
          return c.y_prime_sign || ' ';
        }
      }).join(' & ');

      // Row 3: y
      const rowY = 'y & ' + cols.map((c: any) => {
        if (c.x !== undefined) {
          if (c.y_pos === 'bottom/top' || c.y_pos === 'top/bottom') {
            return (c.y || '').split('/').join(' \\ \\parallel \\ ');
          }
          return c.y || ' ';
        } else {
          if (c.y_prime_sign === '+') return '\\nearrow';
          if (c.y_prime_sign === '-') return '\\searrow';
          return ' ';
        }
      }).join(' & ');

      return `$$\n{\\renewcommand{\\arraystretch}{2}\n\\setlength{\\arraycolsep}{12pt}\n\\begin{array}{${colSpec}}\n${rowX} \\\\\n\\hline\n${rowYPrime} \\\\\n\\hline\n${rowY}\n\\end{array}}\n$$`;
    } catch (err) {
      console.error('Failed to parse BBT JSON in export:', err);
      return `*(Lỗi vẽ bảng biến thiên)*`;
    }
  });
}

/**
 * Hàm hỗ trợ xử lý kí tự toán học cho chuẩn TeX (Pandoc)
 * Pandoc hỗ trợ tốt $...$ và $$...$$, trong khi Mathpix có thể trả về \( \) hoặc \[ \]
 */
export const normalizeMathForPandoc = (text: string): string => {
  let processed = cleanMathpixData(text);
  // Convert any JSON variation tables to LaTeX array for Pandoc compatibility
  processed = convertBbtJsonToLatex(processed);
  return processed;
};

/**
 * Chuyển đổi một danh sách Block thành chuỗi Markdown
 */
export const blocksToMarkdown = (blocks: Block[], questionNumbers: Record<string, number>): string => {
  let md = '';

  blocks.forEach(block => {
    if (block.type === 'headline') {
      md += `\n# ${block.content}\n\n`;
    } else if (block.type === 'subheadline') {
      md += `\n## ${block.content}\n\n`;
    } else if (block.type === 'textbox') {
      md += `\n${block.content}\n\n`;
    } else if (block.type === 'question') {
      const q = block.content;
      if (!q || typeof q !== 'object') return;

      const displayNum = q.manualNumber !== undefined && q.manualNumber !== ''
        ? q.manualNumber
        : questionNumbers[block.id];

      const statement = normalizeMathForPandoc(q.statement || q.content || '');

      md += `\n**Câu ${displayNum}:** ${statement}\n\n`;

      if (q.options && Array.isArray(q.options)) {
        if (q.options.length === 4) {
          md += `\n\`\`\`{=latex}\n\\begin{multicols}{2}\n\`\`\`\n\n`;
          const getOptStr = (idx: number) => `**${String.fromCharCode(65 + idx)}.** ` + normalizeMathForPandoc(q.options[idx].content || q.options[idx].statement || '');

          // Render theo thứ tự (A, C, B, D) để lúc chia 2 cột, kết quả hiển thị từ trái qua phải sẽ là A B / C D
          md += getOptStr(0) + `\n\n`;
          md += getOptStr(2) + `\n\n`;
          md += getOptStr(1) + `\n\n`;
          md += getOptStr(3) + `\n\n`;

          md += `\`\`\`{=latex}\n\\end{multicols}\n\`\`\`\n\n`;
        } else {
          // Render các phương án đáp án, có thể dạng danh sách
          q.options.forEach((opt: any, idx: number) => {
            const optLabel = String.fromCharCode(65 + idx);
            const optContent = normalizeMathForPandoc(opt.content || opt.statement || '');
            md += `**${optLabel}.** ${optContent}\n\n`;
          });
        }
      }
    }
  });

  return md;
};

