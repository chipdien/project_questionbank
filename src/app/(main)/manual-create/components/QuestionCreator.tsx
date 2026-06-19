'use client';

import React from 'react';
import VditorEditor from '@/lib/components/ui/VditorEditor';
import AnswerForm from './AnswerForm';
import ClassificationSidebar from './ClassificationSidebar';
import SaveCollectionModal from './SaveCollectionModal';
import { useQuestionCreator, Difficulty, Tag, Topic } from '../hooks/useQuestionCreator';

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
  const { state, actions } = useQuestionCreator({
    difficulties,
    initialCollections,
  });

  const {
    collections,
    isCollectionModalOpen,
    questionType,
    statement,
    options,
    hint,
    selectedGrade,
    selectedDifficulty,
    selectedTopicIds,
    selectedTagIds,
    isSaving,
    message,
  } = state;

  const {
    setQuestionType,
    setStatement,
    setOptions,
    setHint,
    setSelectedGrade,
    setSelectedDifficulty,
    setSelectedTopicIds,
    setSelectedTagIds,
    setIsCollectionModalOpen,
    handleSave,
    handleConfirmSave,
  } = actions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 flex-1 items-start">
      {/* Cột trái (70%): Biên soạn chính */}
      <div className="lg:col-span-7 flex flex-col gap-6">

        {/* VÙNG 1: Loại hình câu hỏi */}
        <div className="p-6 bg-white/70 backdrop-blur-md border border-outline-variant/30 border-l-4 border-l-indigo-500 bg-linear-to-r from-indigo-500/5 to-transparent rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
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
                    className={`flex flex-col items-center justify-center p-3 text-center rounded-xl border transition-all duration-200 cursor-pointer ${isActive
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
        <div className="p-6 bg-white/70 backdrop-blur-md border border-outline-variant/30 border-l-4 border-l-blue-500 bg-linear-to-r from-blue-500/5 to-transparent rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
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
        <div className="p-6 bg-white/70 backdrop-blur-md border border-outline-variant/30 border-l-4 border-l-emerald-500 bg-linear-to-r from-emerald-500/5 to-transparent rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
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
