'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

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

interface BbtEditorProps {
  value: string; // JSON string inside ```bbt
  onChange: (newValue: string) => void;
}

export default function BbtEditor({ value, onChange }: BbtEditorProps) {
  const [data, setData] = useState<BbtData>({ cols: [] });
  const [error, setError] = useState<string | null>(null);

  // Parse initial value
  useEffect(() => {
    try {
      if (!value || value.trim() === '') {
        setData({ cols: [] });
        setError(null);
        return;
      }
      // Fix backslash in case it is invalid JSON escape
      const fixedValue = value.replace(/\\(?!["\\])/g, '\\\\');
      const parsed = JSON.parse(fixedValue);
      if (parsed && Array.isArray(parsed.cols)) {
        setData(parsed);
        setError(null);
      } else {
        setData({ cols: [] });
      }
    } catch (err: any) {
      setError(err.message || 'JSON không hợp lệ');
    }
  }, [value]);

  const updateCols = (newCols: BbtColumn[]) => {
    const updated = { cols: newCols };
    setData(updated);
    onChange(JSON.stringify(updated, null, 2));
  };

  const handleColChange = (index: number, fields: Partial<BbtColumn>) => {
    const newCols = [...data.cols];
    newCols[index] = { ...newCols[index], ...fields };
    updateCols(newCols);
  };

  const deletePoint = (pointIdx: number) => {
    // pointIdx must be even. We delete the point and its adjacent interval.
    // Interval index: if pointIdx is last, delete previous interval (pointIdx - 1), otherwise next interval (pointIdx + 1).
    if (data.cols.length <= 1) return; // Cannot delete last point
    
    let toDeleteIndices = [pointIdx];
    if (pointIdx === data.cols.length - 1) {
      toDeleteIndices.push(pointIdx - 1);
    } else {
      toDeleteIndices.push(pointIdx + 1);
    }

    const newCols = data.cols.filter((_, idx) => !toDeleteIndices.includes(idx));
    updateCols(newCols);
  };

  const addPoint = () => {
    // Add an interval column and a point column at the end
    const lastCol = data.cols[data.cols.length - 1];
    const defaultSign = lastCol && lastCol.y_pos === 'top' ? '-' : '+';
    
    const newCols = [
      ...data.cols,
      { y_prime_sign: defaultSign as '+' | '-' },
      { x: 'x_new', y_prime: '0', y: 'y_new', y_pos: 'bottom' as const }
    ];
    updateCols(newCols);
  };

  // Helper template buttons to quickly generate standard function BBTs
  const applyTemplate = (type: 'bac3' | 'trungphuong' | 'phanthuc') => {
    let templateCols: BbtColumn[] = [];
    if (type === 'bac3') {
      templateCols = [
        { x: '-\\infty', y_prime: '', y: '-\\infty', y_pos: 'bottom' },
        { y_prime_sign: '+' },
        { x: '-2', y_prime: '0', y: '20', y_pos: 'top' },
        { y_prime_sign: '-' },
        { x: '1', y_prime: '0', y: '-7', y_pos: 'bottom' },
        { y_prime_sign: '+' },
        { x: '+\\infty', y_prime: '', y: '+\\infty', y_pos: 'top' }
      ];
    } else if (type === 'trungphuong') {
      templateCols = [
        { x: '-\\infty', y_prime: '', y: '+\\infty', y_pos: 'top' },
        { y_prime_sign: '-' },
        { x: '-1', y_prime: '0', y: '3', y_pos: 'top' },
        { y_prime_sign: '+' },
        { x: '0', y_prime: '0', y: '2', y_pos: 'bottom' },
        { y_prime_sign: '-' },
        { x: '1', y_prime: '0', y: '3', y_pos: 'top' },
        { y_prime_sign: '+' },
        { x: '+\\infty', y_prime: '', y: '+\\infty', y_pos: 'top' }
      ];
    } else if (type === 'phanthuc') {
      templateCols = [
        { x: '-\\infty', y_prime: '', y: '2', y_pos: 'middle' },
        { y_prime_sign: '-' },
        { x: '-1', y_prime: '||', y: '-\\infty/+\\infty', y_pos: 'bottom/top' },
        { y_prime_sign: '-' },
        { x: '+\\infty', y_prime: '', y: '2', y_pos: 'middle' }
      ];
    }
    updateCols(templateCols);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Trình soạn thảo Bảng biến thiên trực quan
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Các thay đổi sẽ tự động đồng bộ vào nội dung Markdown bên trên.
          </p>
        </div>
        
        {/* Templates */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Mẫu nhanh:</span>
          <button
            type="button"
            onClick={() => applyTemplate('bac3')}
            className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded font-medium transition-all"
          >
            Hàm bậc 3
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('trungphuong')}
            className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded font-medium transition-all"
          >
            Bậc 4 Trùng phương
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('phanthuc')}
            className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded font-medium transition-all"
          >
            Bậc 1/Bậc 1
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-2.5 rounded-lg text-xs border border-red-200 dark:border-red-900/50">
          <strong>Lỗi cú pháp JSON:</strong> {error}. Vui lòng kiểm tra lại định dạng JSON của bảng biến thiên trong markdown.
        </div>
      )}

      {data.cols.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[600px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="p-2 border border-slate-200 dark:border-slate-700 text-center w-20">Hàng</th>
                  {data.cols.map((col, idx) => {
                    const isPoint = col.x !== undefined;
                    return (
                      <th
                        key={`th-${idx}`}
                        className={`p-2 border border-slate-200 dark:border-slate-700 text-center ${
                          isPoint ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : 'w-16'
                        }`}
                      >
                        {isPoint ? `Điểm ${idx / 2 + 1}` : `Khoảng`}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Dòng x */}
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-semibold text-center bg-slate-50 dark:bg-slate-850">
                    Giá trị x
                  </td>
                  {data.cols.map((col, idx) => {
                    const isPoint = col.x !== undefined;
                    if (!isPoint) {
                      return <td key={`x-td-${idx}`} className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20" />;
                    }
                    return (
                      <td key={`x-td-${idx}`} className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <input
                          type="text"
                          value={col.x || ''}
                          onChange={(e) => handleColChange(idx, { x: e.target.value })}
                          className="w-full px-2 py-1 text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200"
                          placeholder="e.g. 1"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Dòng y' */}
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-semibold text-center bg-slate-50 dark:bg-slate-850">
                    Đạo hàm y'
                  </td>
                  {data.cols.map((col, idx) => {
                    const isPoint = col.x !== undefined;
                    if (!isPoint) {
                      // Interval: sign of y'
                      return (
                        <td key={`yp-td-${idx}`} className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20">
                          <select
                            value={col.y_prime_sign || ''}
                            onChange={(e) => handleColChange(idx, { y_prime_sign: e.target.value as '+' | '-' | '0' })}
                            className="w-full py-0.5 text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 font-bold"
                          >
                            <option value="+">+</option>
                            <option value="-">-</option>
                            <option value="0">0</option>
                          </select>
                        </td>
                      );
                    }
                    // Point: value of y'
                    return (
                      <td key={`yp-td-${idx}`} className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <input
                          type="text"
                          value={col.y_prime || ''}
                          onChange={(e) => handleColChange(idx, { y_prime: e.target.value })}
                          className="w-full px-2 py-1 text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                          placeholder="0 hoặc ||"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Dòng y */}
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-semibold text-center bg-slate-50 dark:bg-slate-850">
                    Cực trị y
                  </td>
                  {data.cols.map((col, idx) => {
                    const isPoint = col.x !== undefined;
                    if (!isPoint) {
                      return <td key={`y-td-${idx}`} className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20" />;
                    }
                    return (
                      <td key={`y-td-${idx}`} className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-1.5">
                        <input
                          type="text"
                          value={col.y || ''}
                          onChange={(e) => handleColChange(idx, { y: e.target.value })}
                          className="w-full px-2 py-1 text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200"
                          placeholder="e.g. -7"
                        />
                        <select
                          value={col.y_pos || 'middle'}
                          onChange={(e) =>
                            handleColChange(idx, {
                              y_pos: e.target.value as 'top' | 'bottom' | 'middle' | 'bottom/top' | 'top/bottom',
                            })
                          }
                          className="w-full py-0.5 px-1 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                        >
                          <option value="top">Cực đại (top)</option>
                          <option value="bottom">Cực tiểu (bottom)</option>
                          <option value="middle">Ngang (middle)</option>
                          <option value="bottom/top">TCĐ (b/t)</option>
                          <option value="top/bottom">TCĐ (t/b)</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>

                {/* Dòng thao tác */}
                <tr>
                  <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-semibold text-center bg-slate-50 dark:bg-slate-850">
                    Thao tác
                  </td>
                  {data.cols.map((col, idx) => {
                    const isPoint = col.x !== undefined;
                    if (!isPoint) {
                      return <td key={`action-td-${idx}`} className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20" />;
                    }
                    return (
                      <td key={`action-td-${idx}`} className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center">
                        <button
                          type="button"
                          disabled={data.cols.filter((c) => c.x !== undefined).length <= 2}
                          onClick={() => deletePoint(idx)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="Xóa điểm cực trị này"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addPoint}
              className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm điểm cực trị
            </button>

            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Sử dụng các ký hiệu LaTeX như \infty, -\infty, \sqrt{2} nếu cần hiển thị toán học đẹp mắt.
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">Chưa có bảng biến thiên trong nội dung câu hỏi.</p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => applyTemplate('bac3')}
              className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold transition-all"
            >
              Khởi tạo bảng biến thiên hàm bậc 3
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
