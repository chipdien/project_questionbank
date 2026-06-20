'use client';

import { FileText, Save } from 'lucide-react';
import Loading from '@/lib/components/ui/Loading';
import VditorEditor from '@/lib/components/ui/VditorEditor';
import AnswerForm from './AnswerForm';
import ClassificationSidebar from './ClassificationSidebar';
import SaveCollectionModal from './SaveCollectionModal';
import { useQuestionCreator } from '../hooks/useQuestionCreator';
import { QuestionCreatorProps } from '@/lib/types/manual-question.type';

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
    <div className="flex flex-col gap-6 w-full">
      {/* SECTION 1: Classification & Settings Toolbar (Horizontal) */}
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
        questionType={questionType}
        setQuestionType={setQuestionType}
        isSaving={isSaving}
      />

      {/* SECTION 2: Question Statement */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-on-surface select-none">
              Nội dung câu hỏi (Đề bài)
            </span>
          </div>
          {questionType === 'FILL_IN' && (
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
              📌 Dùng cú pháp <code className="font-mono font-bold">[blank]</code> để đánh dấu ô trống.
            </span>
          )}
        </div>
        <div className="w-full">
          <VditorEditor
            value={statement}
            onChange={setStatement}
            isStickyToolbar={false}
            placeholder="Nhập nội dung đề bài câu hỏi bằng Markdown hoặc LaTeX..."
            className="w-full"
          />
        </div>
      </div>

      {/* SECTION 3: Answers Form */}
      <AnswerForm
        questionType={questionType}
        statement={statement}
        options={options}
        setOptions={setOptions}
        hint={hint}
        setHint={setHint}
      />



      {/* Action Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Đang lưu...' : 'Lưu câu hỏi'}
        </button>
      </div>

      <SaveCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        collections={collections}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
      />

      {isSaving && <Loading fullscreen text="Đang lưu câu hỏi..." />}
    </div>
  );
}
