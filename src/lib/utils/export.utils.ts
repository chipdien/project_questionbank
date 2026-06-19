import { Block } from '@/app/(main)/documents/components/DocumentBuilder';
import { cleanMathpixData } from './math.utils';

/**
 * Hàm hỗ trợ xử lý kí tự toán học cho chuẩn TeX (Pandoc)
 * Pandoc hỗ trợ tốt $...$ và $$...$$, trong khi Mathpix có thể trả về \( \) hoặc \[ \]
 */
export const normalizeMathForPandoc = (text: string): string => {
  let processed = cleanMathpixData(text);
  // Đôi khi convert ngược lại để native pandoc md dễ parse (tuỳ chọn)
  // Thực tế Pandoc có tex_math_dollars và tex_math_single_backslash mặc định.
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

