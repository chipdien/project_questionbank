'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VditorEditor from '@/components/ui/VditorEditor';
import AnswerForm from './AnswerForm';
import ClassificationSidebar from './ClassificationSidebar';
import SaveCollectionModal from './SaveCollectionModal';
import { createManualQuestionAction } from '@/actions/question-manual';

interface Difficulty {
  id: number;
  name: string;
  color_code: string;
}

interface Tag {
  id: number;
  name: string;
  category: string;
}

interface Topic {
  id: number;
  title: string;
  parent_id: number | null;
  path: string;
}

interface Option {
  content: string;
  order: number;
  weight: number;
}

interface QuestionCreatorProps {
  difficulties: Difficulty[];
  tags: Tag[];
  topics: Topic[];
  initialCollections?: any[];
}

export default function QuestionCreator({
  difficulties,
  tags,
  topics,
  initialCollections = [],
}: QuestionCreatorProps) {
  const router = useRouter();

  // Collections state
  const [collections, setCollections] = useState<any[]>(initialCollections);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [saveRedirectAfterConfirm, setSaveRedirectAfterConfirm] = useState(false);

  // General States
  const [questionType, setQuestionType] = useState('SINGLE_CHOICE');
  const [statement, setStatement] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [hint, setHint] = useState('');

  // Classification States
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Set default difficulty
  useEffect(() => {
    if (difficulties.length > 0) {
      const defaultDiff = difficulties.find(d => d.name.includes('Thông hiểu')) || difficulties[0];
      setSelectedDifficulty(defaultDiff.name);
    }
  }, [difficulties]);

  // Handle Save (Trigger validation first)
  const handleSave = (redirectAfterSave: boolean) => {
    if (!statement.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập nội dung đề bài.' });
      return;
    }

    // Validate options
    if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
      const emptyOptIdx = options.findIndex(opt => !opt.content.trim());
      if (emptyOptIdx !== -1) {
        setMessage({ type: 'error', text: `Vui lòng nhập nội dung cho phương án ${String.fromCharCode(65 + emptyOptIdx)}.` });
        return;
      }

      const hasCorrect = options.some(opt => opt.weight === 1);
      if (!hasCorrect) {
        setMessage({ type: 'error', text: 'Vui lòng chọn ít nhất một đáp án đúng cho câu hỏi trắc nghiệm.' });
        return;
      }
    } else if (questionType === 'TRUE_FALSE') {
      const emptyTFIdx = options.findIndex(opt => !opt.content.trim());
      if (emptyTFIdx !== -1) {
        setMessage({ type: 'error', text: `Vui lòng nhập nội dung cho phát biểu thứ ${emptyTFIdx + 1}.` });
        return;
      }
    } else if (questionType === 'FILL_IN') {
      if (options.length === 0) {
        setMessage({ type: 'error', text: 'Vui lòng thêm ít nhất một chỗ trống [blank] và nhập đáp án tương ứng.' });
        return;
      }
      const emptyFillIdx = options.findIndex(opt => !opt.content.trim());
      if (emptyFillIdx !== -1) {
        setMessage({ type: 'error', text: `Vui lòng điền đáp án cho ô trống thứ ${emptyFillIdx + 1}.` });
        return;
      }
    } else if (questionType === 'ESSAY') {
      if (!hint.trim()) {
        setMessage({ type: 'error', text: 'Vui lòng nhập nội dung đáp án / hướng dẫn giải cho câu hỏi tự luận.' });
        return;
      }
    }

    setSaveRedirectAfterConfirm(redirectAfterSave);
    setIsCollectionModalOpen(true);
  };

  // Perform actual save after collection selected/created in modal
  const handleConfirmSave = async (collectionId?: number, newTitle?: string) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        statement,
        question_type: questionType,
        question_difficulty: selectedDifficulty,
        grade: selectedGrade,
        hint: hint || undefined,
        options: options.map(o => ({
          content: o.content,
          order: o.order,
          weight: o.weight,
        })),
        topicIds: selectedTopicIds,
        tagIds: selectedTagIds,
        collectionId,
        newCollectionTitle: newTitle,
      };

      const res = await createManualQuestionAction(payload);

      if (res.success) {
        setMessage({ type: 'success', text: 'Đã lưu câu hỏi thành công!' });
        setIsCollectionModalOpen(false);

        // Update local collections list
        const createdCollId = res.data?.createdCollectionId;
        const createdCollTitle = res.data?.createdCollectionTitle;
        if (createdCollId && createdCollTitle) {
          setCollections(prev => [
            { id: createdCollId, title: createdCollTitle, question_count: 1 },
            ...prev,
          ]);
        } else if (collectionId) {
          setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, question_count: (c.question_count || 0) + 1 } : c));
        }

        // Reset form
        setStatement('');
        setHint('');
        setSelectedTopicIds([]);
        setSelectedTagIds([]);

        // Re-initialize options based on current type
        if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
          setOptions([
            { content: '', order: 1, weight: 0 },
            { content: '', order: 2, weight: 0 },
            { content: '', order: 3, weight: 0 },
            { content: '', order: 4, weight: 0 },
          ]);
        } else if (questionType === 'TRUE_FALSE') {
          setOptions([
            { content: 'Mệnh đề a', order: 1, weight: 1 },
            { content: 'Mệnh đề b', order: 2, weight: 1 },
            { content: 'Mệnh đề c', order: 3, weight: 1 },
            { content: 'Mệnh đề d', order: 4, weight: 1 },
          ]);
        } else {
          setOptions([]);
        }

        if (saveRedirectAfterConfirm) {
          const targetCollectionId = createdCollId || collectionId;
          setTimeout(() => {
            if (targetCollectionId) {
              router.push(`/collection/${targetCollectionId}`);
            } else {
              router.push('/question-bank');
            }
          }, 800);
        }
      } else {
        setMessage({ type: 'error', text: res.error || 'Lỗi khi lưu câu hỏi.' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Đã xảy ra lỗi kết nối hệ thống.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc chắn muốn hủy?')) {
      router.push('/question-bank');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 flex-1 items-start">
      {/* Cột trái (70%): Biên soạn chính */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* VÙNG 1: Loại hình câu hỏi */}
        <div className="p-6 bg-white/70 backdrop-blur-md border border-outline-variant/30 border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-500/5 to-transparent rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">settings</span>
              Loại hình câu hỏi
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                {
                  value: 'SINGLE_CHOICE',
                  label: 'Trắc nghiệm đơn',
                  desc: 'Một đáp án đúng',
                  icon: 'radio_button_checked',
                  activeColor: 'border-blue-600 bg-blue-500/5 text-blue-700 ring-2 ring-blue-500/10 shadow-sm',
                },
                {
                  value: 'MULTIPLE_CHOICE',
                  label: 'Trắc nghiệm nhiều',
                  desc: 'Nhiều đáp án đúng',
                  icon: 'check_box',
                  activeColor: 'border-emerald-600 bg-emerald-500/5 text-emerald-700 ring-2 ring-emerald-500/10 shadow-sm',
                },
                {
                  value: 'TRUE_FALSE',
                  label: 'Đúng / Sai',
                  desc: 'Đánh giá mệnh đề',
                  icon: 'rule',
                  activeColor: 'border-purple-600 bg-purple-500/5 text-purple-700 ring-2 ring-purple-500/10 shadow-sm',
                },
                {
                  value: 'FILL_IN',
                  label: 'Điền ô trống',
                  desc: 'Điền khuyết đề bài',
                  icon: 'edit_square',
                  activeColor: 'border-orange-600 bg-orange-500/5 text-orange-700 ring-2 ring-orange-500/10 shadow-sm',
                },
                {
                  value: 'ESSAY',
                  label: 'Tự luận',
                  desc: 'Nhập câu trả lời tự do',
                  icon: 'description',
                  activeColor: 'border-rose-600 bg-rose-500/5 text-rose-700 ring-2 ring-rose-500/10 shadow-sm',
                },
              ].map((type) => {
                const isActive = questionType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setQuestionType(type.value)}
                    className={`flex flex-col items-center justify-center p-3 text-center rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? type.activeColor
                        : 'bg-white border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60 hover:bg-surface-container-low'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-xl mb-1.5 ${isActive ? '' : 'text-outline-variant'}`}>
                      {type.icon}
                    </span>
                    <span className="text-xs font-bold block truncate max-w-full">
                      {type.label}
                    </span>
                    <span className="text-[10px] text-outline mt-0.5 leading-tight hidden lg:block">
                      {type.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* VÙNG 2: Nội dung câu hỏi (Đề bài) */}
        <div className="p-6 bg-white/70 backdrop-blur-md border border-outline-variant/30 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-transparent rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Nội dung câu hỏi (Đề bài)
              </label>
              {questionType === 'FILL_IN' && (
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  📌 Dùng cú pháp <code className="font-mono font-bold">[blank]</code> để đánh dấu ô trống.
                </span>
              )}
            </div>
            <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
              <VditorEditor
                value={statement}
                onChange={setStatement}
                isStickyToolbar={false}
                placeholder="Nhập nội dung đề bài câu hỏi bằng Markdown hoặc LaTeX..."
                className="w-full min-h-[180px]"
              />
            </div>
          </div>
        </div>

        {/* VÙNG 3: Cấu hình đáp án & Lời giải */}
        <div className="p-6 bg-white/70 backdrop-blur-md border border-outline-variant/30 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <AnswerForm
            questionType={questionType}
            statement={statement}
            options={options}
            setOptions={setOptions}
            hint={hint}
            setHint={setHint}
          />
        </div>

        {/* Thông báo lỗi / thành công */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold border transition-all ${message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            {message.text}
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex justify-end p-4 bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-2xl shadow-sm">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu câu hỏi'}
          </button>
        </div>
      </div>

      {/* Cột phải (30%): Phân loại */}
      <div className="lg:col-span-3">
        <ClassificationSidebar
          difficulties={difficulties}
          tags={tags}
          topics={topics}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          selectedTopicIds={selectedTopicIds}
          setSelectedTopicIds={setSelectedTopicIds}
          selectedTagIds={selectedTagIds}
          setSelectedTagIds={setSelectedTagIds}
        />
      </div>

      <SaveCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        collections={collections}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
      />
    </div>
  );
}
