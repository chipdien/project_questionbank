'use client';

import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

interface BbtColumn {
  x?: string;
  y_prime?: string;
  y?: string;
  y_pos?: 'top' | 'bottom' | 'middle' | 'bottom/top' | 'top/bottom';
  y_prime_sign?: '+' | '-' | '0';
}

interface BbtData {
  cols: BbtColumn[];
}

const isInfinity = (val: string | undefined): boolean => {
  if (!val) return false;
  const clean = val.trim();
  return clean.includes('infty') || clean.includes('oo') || clean.includes('∞');
};

// Trả về phần trăm chiều cao (y-coordinate) để vẽ SVG Line kết nối chính xác
const getYLevel = (y_pos: string | undefined, y_val: string | undefined): string => {
  if (!y_pos) return '50%';
  if (y_pos === 'top') {
    return isInfinity(y_val) ? '12%' : '32%';
  }
  if (y_pos === 'bottom') {
    return isInfinity(y_val) ? '88%' : '68%';
  }
  return '50%';
};

export default function VariationTableRenderer({ dataString }: { dataString: string }) {
  let data: BbtData;
  try {
    data = JSON.parse(dataString);
  } catch (err) {
    try {
      // Tự động sửa các dấu gạch chéo ngược LaTeX bị thiếu escape trong chuỗi JSON (ví dụ \i -> \\i)
      const fixedDataString = dataString.replace(/\\(?!["\\])/g, '\\\\');
      data = JSON.parse(fixedDataString);
    } catch (err2) {
      console.error('Failed to parse BBT JSON:', err);
      return (
        <pre className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-2 rounded text-xs border border-red-200 dark:border-red-900/50">
          Lỗi phân tích cú pháp bảng biến thiên: {dataString}
        </pre>
      );
    }
  }

  const cols = data.cols || [];
  if (cols.length === 0) return null;

  // Render helper using react-markdown with remarkMath & rehypeKatex
  const renderMath = (text: string | undefined) => {
    if (!text) return '';
    const cleanText = text.trim();
    // Tự động bao bọc bằng $ nếu chưa có
    const wrapped = cleanText.startsWith('$') ? cleanText : `$${cleanText}$`;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }]]}
      >
        {wrapped}
      </ReactMarkdown>
    );
  };

  return (
    <div className="w-full my-4 overflow-x-auto select-none rounded bg-white p-1 no-scrollbar-custom">
      <style>{`
        .no-scrollbar-custom::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar-custom {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Cấu hình hiển thị trọn vẹn trên màn hình preview A4 */
        .a4-page .no-scrollbar-custom {
          overflow: visible !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .a4-page .no-scrollbar-custom > div {
          min-width: 0 !important;
          width: 100% !important;
        }
        @media print {
          .no-scrollbar-custom {
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .no-scrollbar-custom > div {
            min-width: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
      <div
        className="grid items-stretch text-center border border-slate-300 rounded-lg overflow-hidden min-w-[500px]"
        style={{
          gridTemplateColumns: `80px repeat(${cols.length}, minmax(40px, 1fr))`,
        }}
      >
        {/* ROW 1: x */}
        <div className="flex items-center justify-center font-bold bg-slate-50 border-r border-b border-slate-300 py-3 text-slate-800">
          {renderMath('x')}
        </div>
        {cols.map((col, idx) => (
          <div key={`x-${idx}`} className="flex items-center justify-center border-b border-slate-300 py-3 px-1 text-sm text-slate-800">
            {col.x ? renderMath(col.x) : ''}
          </div>
        ))}

        {/* ROW 2: y' */}
        <div className="flex items-center justify-center font-bold bg-slate-50 border-r border-b border-slate-300 py-3 text-slate-800">
          {renderMath('y\'')}
        </div>
        {cols.map((col, idx) => {
          const isPoint = col.x !== undefined;
          return (
            <div key={`y-prime-${idx}`} className="flex items-stretch justify-center border-b border-slate-300 py-3 px-1 text-sm text-slate-800">
              {isPoint ? (
                col.y_prime === '||' ? (
                  <div className="flex justify-between h-6 mx-auto relative select-none w-1.5 py-0.5">
                    <div className="w-px h-full bg-slate-400"></div>
                    <div className="w-px h-full bg-slate-400 ml-[2px]"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    {/* Render chính xác giá trị y_prime và không mặc định về 0 ở các điểm vô cùng */}
                    {renderMath(col.y_prime || '')}
                  </div>
                )
              ) : (
                <span className="font-semibold text-slate-600 flex items-center justify-center">
                  {col.y_prime_sign || ''}
                </span>
              )}
            </div>
          );
        })}

        {/* ROW 3: y */}
        <div className="flex items-center justify-center font-bold bg-slate-50 border-r border-slate-300 min-h-[140px] text-slate-800">
          {renderMath('y')}
        </div>
        {cols.map((col, idx) => {
          const isPoint = col.x !== undefined;

          // Cân chỉnh độ cao cực trị động (Vô cực nằm ở mép biên tuyệt đối, số thực nằm lùi vào trong)
          let posClass = 'justify-center items-center';
          if (col.y_pos === 'top') {
            posClass = isInfinity(col.y) ? 'justify-center items-start pt-1.5' : 'justify-center items-start pt-8';
          }
          if (col.y_pos === 'bottom') {
            posClass = isInfinity(col.y) ? 'justify-center items-end pb-1.5' : 'justify-center items-end pb-8';
          }
          if (col.y_pos === 'bottom/top' || col.y_pos === 'top/bottom') {
            posClass = 'justify-between items-stretch py-2 flex-col h-full';
          }

          // SVG Arrow overlay logic
          let arrowSvg = null;
          if (!isPoint && idx > 0 && idx < cols.length - 1) {
            const prevCol = cols[idx - 1];
            const nextCol = cols[idx + 1];

            const p1 = prevCol.y_pos || 'bottom';
            const p2 = nextCol.y_pos || 'bottom';

            let y1 = getYLevel(p1, prevCol.y);
            let y2 = getYLevel(p2, nextCol.y);

            // Cân chỉnh điểm bắt đầu/kết thúc mũi tên tại vách tiệm cận đứng
            if (p1 === 'bottom/top') y1 = '12%';
            if (p1 === 'top/bottom') y1 = '88%';
            if (p2 === 'bottom/top') y2 = '88%';
            if (p2 === 'top/bottom') y2 = '12%';

            arrowSvg = (
              <svg className="w-full h-full text-slate-400" style={{ minHeight: '100px' }}>
                <defs>
                  <marker
                    id={`arrow-${idx}`}
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
                  </marker>
                </defs>
                <line
                  x1="10%"
                  y1={y1}
                  x2="90%"
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  markerEnd={`url(#arrow-${idx})`}
                />
              </svg>
            );
          }

          return (
            <div key={`y-${idx}`} className="relative flex min-h-[140px] h-full text-slate-800">
              {isPoint ? (
                <div className={`flex w-full h-full ${posClass} text-sm px-1`}>
                  {col.y_pos === 'bottom/top' || col.y_pos === 'top/bottom' ? (
                    <>
                      {/* Giá trị trái tiệm cận đứng */}
                      <div className={`flex-1 flex justify-center text-slate-600 text-xs ${col.y_pos === 'bottom/top' ? 'items-end pb-1.5' : 'items-start pt-1.5'}`}>
                        {renderMath(col.y?.split('/')[0] || '')}
                      </div>

                      {/* Vách đứng nét đôi */}
                      <div className="flex justify-between h-full relative mx-1 py-1 select-none">
                        <div className="w-px h-full bg-slate-300"></div>
                        <div className="w-px h-full bg-slate-300 ml-[2px]"></div>
                      </div>

                      {/* Giá trị phải tiệm cận đứng */}
                      <div className={`flex-1 flex justify-center text-slate-600 text-xs ${col.y_pos === 'bottom/top' ? 'items-start pt-1.5' : 'items-end pb-1.5'}`}>
                        {renderMath(col.y?.split('/')[1] || '')}
                      </div>
                    </>
                  ) : (
                    renderMath(col.y)
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {arrowSvg}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
