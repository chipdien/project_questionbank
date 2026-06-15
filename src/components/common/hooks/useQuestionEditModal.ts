import { useState, useEffect, useRef } from 'react';

// Hàm chuẩn hóa riêng dành cho modal để editor Vditor hiển thị đúng
export const cleanMathDelimiters = (text: string) => {
  if (!text) return '';

  // 1. Khử double-escape AN TOÀN: Chỉ khử khi theo sau là lệnh/ký hiệu LaTeX
  // Tránh làm hỏng lệnh xuống dòng (\\) trong bảng/ma trận.
  let cleaned = text.replace(/\\\\(?=[a-zA-Z|(){}\[\]%])/g, '\\');

  return cleaned
    // 2. Block Math: Vditor BẮT BUỘC dấu $$ phải nằm tách biệt trên một dòng riêng.
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$\n$1\n$$$$')
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '$$$$\n$1\n$$$$')
    // 3. Inline Math: \( \) chuyển thẳng về $ $
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$$')
    // 4. Quan trọng: xóa bỏ các dấu ngắt dòng (\n) nằm lọt thỏm bên trong inline math $...$
    .replace(/(?<!\$)\$([^\$]+?)\$(?!\$)/g, (match, p1) => {
      const cleanedInner = p1.replace(/\s+/g, ' ').trim();
      return `$${cleanedInner}$`;
    });
};

export const splitOptionsOcrText = (text: string): string[] | null => {
  const regexA = /(?:^|[\s\r\n])(?:[Aa][\.\)\/]|\[[Aa]\]|Phương án [Aa]:?|Đáp án [Aa]:?)\s*/;
  const regexB = /(?:^|[\s\r\n])(?:[Bb][\.\)\/]|\[[Bb]\]|Phương án [Bb]:?|Đáp án [Bb]:?)\s*/;
  const regexC = /(?:^|[\s\r\n])(?:[Cc][\.\)\/]|\[[Cc]\]|Phương án [Cc]:?|Đáp án [Cc]:?)\s*/;
  const regexD = /(?:^|[\s\r\n])(?:[Dd][\.\)\/]|\[[Dd]\]|Phương án [Dd]:?|Đáp án [Dd]:?)\s*/;

  const matchA = text.match(regexA);
  const matchB = text.match(regexB);
  const matchC = text.match(regexC);
  const matchD = text.match(regexD);

  if (matchA && matchB && matchC && matchD) {
    const idxA = matchA.index! + matchA[0].length;
    const idxB = matchB.index!;
    const idxBEnd = matchB.index! + matchB[0].length;
    const idxC = matchC.index!;
    const idxCEnd = matchC.index! + matchC[0].length;
    const idxD = matchD.index!;
    const idxDEnd = matchD.index! + matchD[0].length;

    if (idxA < idxB && idxBEnd < idxC && idxCEnd < idxD) {
      const optA = text.substring(idxA, idxB).trim();
      const optB = text.substring(idxBEnd, idxC).trim();
      const optC = text.substring(idxCEnd, idxD).trim();
      const optD = text.substring(idxDEnd).trim();
      return [optA, optB, optC, optD];
    }
  }

  // Fallback: Split by newline if there are exactly 4 lines
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 4) {
    return lines.map(line => 
      line.replace(/^(?:[A-Da-d][\.\)\/]|\[[A-Da-d]\]|Phương án [A-Da-d]:?|Đáp án [A-Da-d]:?)\s*/i, '').trim()
    );
  }

  return null;
};

interface UseQuestionEditModalProps {
  isOpen: boolean;
  question: any;
  onSave: (updatedQuestion: any) => void;
  onClose: () => void;
  currentUserId?: number | null;
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

export function useQuestionEditModal({
  isOpen,
  question,
  onSave,
  onClose,
  currentUserId,
  isAdmin = false,
  isReadOnly = false
}: UseQuestionEditModalProps) {
  const [localQuestion, setLocalQuestion] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [ocrTarget, setOcrTarget] = useState<'statement' | 'hint' | 'options_all' | number | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    ocrFileInputRef.current?.click();
  };

  const processFileForOcr = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn hoặc dán tệp hình ảnh.');
      return;
    }

    setIsOcrLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64 }),
        });

        if (!response.ok) {
          throw new Error('Lỗi khi quét ảnh bằng Mathpix.');
        }

        const data = await response.json();
        if (data.success && data.text) {
          const mathText = cleanMathDelimiters(data.text);
          if (ocrTarget === 'statement') {
            const currentText = localQuestion.statement || localQuestion.content || '';
            handleStatementChange(currentText ? `${currentText}\n${mathText}` : mathText);
          } else if (ocrTarget === 'hint') {
            const currentText = localQuestion.hint || '';
            handleHintChange(currentText ? `${currentText}\n${mathText}` : mathText);
          } else if (ocrTarget === 'options_all') {
            const optionsList = splitOptionsOcrText(mathText);
            if (optionsList && optionsList.length === 4) {
              setLocalQuestion((prev: any) => {
                if (!prev || !prev.options) return prev;
                const newOptions = prev.options.map((o: any, idx: number) => ({
                  ...o,
                  content: optionsList[idx],
                  statement: optionsList[idx]
                }));
                return { ...prev, options: newOptions };
              });
            } else {
              alert(
                'Không tự động phân tách được thành 4 phương án.\n\n' +
                'Văn bản nhận diện được:\n' + mathText + '\n\n' +
                'Vui lòng đảm bảo hình ảnh hiển thị rõ ràng ký tự các phương án dạng A., B., C., D. hoặc có đúng 4 dòng văn bản.'
              );
            }
          } else if (typeof ocrTarget === 'number') {
            const currentText = localQuestion.options[ocrTarget].content || localQuestion.options[ocrTarget].statement || '';
            handleOptionChange(ocrTarget, currentText ? `${currentText}\n${mathText}` : mathText);
          }
          setOcrTarget(null);
        } else {
          throw new Error(data.error || 'Không nhận diện được ký tự.');
        }
      } catch (error: any) {
        console.error('OCR Error:', error);
        alert(error.message || 'Có lỗi xảy ra khi xử lý OCR.');
      } finally {
        setIsOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFileForOcr(file);
          break;
        }
      }
    }
  };

  useEffect(() => {
    if (ocrTarget === null || isOcrLoading) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFileForOcr(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [ocrTarget, isOcrLoading, localQuestion]);

  useEffect(() => {
    if (isOpen && question) {
      const cloned = JSON.parse(JSON.stringify(question));
      cloned.statement = cleanMathDelimiters(cloned.statement || cloned.content || '');
      if (cloned.options) {
        cloned.options = cloned.options.map((o: any) => ({
          ...o,
          content: cleanMathDelimiters(o.content || o.statement || ''),
          statement: cleanMathDelimiters(o.content || o.statement || ''),
          weight: o.weight !== undefined ? Number(o.weight) : 0,
        }));
      }
      setLocalQuestion(cloned);
    }
  }, [isOpen, question]);

  const isOwner = !isReadOnly && (isAdmin ||
    (localQuestion?.teacher_owned_by_id !== undefined && Number(localQuestion.teacher_owned_by_id) === currentUserId) ||
    (localQuestion?.created_by_id !== undefined && Number(localQuestion.created_by_id) === currentUserId));

  const handleStatementChange = (val: string) => {
    setLocalQuestion((prev: any) => ({ ...prev, statement: val, content: val }));
  };

  const handleHintChange = (val: string) => {
    setLocalQuestion((prev: any) => ({ ...prev, hint: val }));
  };

  const handleOptionChange = (idx: number, val: string) => {
    setLocalQuestion((prev: any) => {
      if (!prev) return prev;
      const newOptions = [...(prev.options || [])];
      newOptions[idx] = { ...newOptions[idx], content: val, statement: val };
      return { ...prev, options: newOptions };
    });
  };

  const handleOptionWeightChange = (targetIdx: number) => {
    setLocalQuestion((prev: any) => {
      if (!prev) return prev;
      const newOptions = (prev.options || []).map((o: any, idx: number) => ({
        ...o,
        weight: idx === targetIdx ? (o.weight === 1 ? 0 : 1) : o.weight
      }));
      return { ...prev, options: newOptions };
    });
  };

  const handleSave = async () => {
    if (!localQuestion) return;

    if (isOwner) {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/questions/${localQuestion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            statement: localQuestion.statement,
            content: localQuestion.content,
            options: localQuestion.options,
            hint: localQuestion.hint,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Lỗi khi lưu câu hỏi vào cơ sở dữ liệu.');
        }

        const data = await response.json();
        if (data.success && data.question) {
          onSave(data.question);
          onClose();
        } else {
          throw new Error('Không nhận được thông tin phản hồi hợp lệ từ server.');
        }
      } catch (error: any) {
        console.error('Lỗi khi lưu câu hỏi:', error);
        alert(error.message || 'Không thể lưu câu hỏi. Vui lòng thử lại.');
      } finally {
        setIsSaving(false);
      }
    } else {
      onSave(localQuestion);
      onClose();
    }
  };

  return {
    localQuestion,
    isSaving,
    ocrTarget,
    setOcrTarget,
    isOcrLoading,
    ocrFileInputRef,
    triggerFileSelect,
    processFileForOcr,
    handlePaste,
    isOwner,
    handleStatementChange,
    handleHintChange,
    handleOptionChange,
    handleOptionWeightChange,
    handleSave
  };
}
