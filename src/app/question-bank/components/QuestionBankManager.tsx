'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import SortableQuestionItem from '@/app/question-bank/components/SortableQuestionItem';
import { getQuestionsByDocId } from '@/actions/question';
import { createCollection } from '@/actions/collection';
import CollectionSaveModal from '@/app/collection/components/CollectionSaveModal';
import { FileText, ChevronRight, Hash, Layers, Loader2, Grab, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Option {
  id: number;
  content: string;
  order: number;
  weight: number;
}

interface Question {
  id: number;
  statement: string;
  grade: string;
  question_difficulty: string;
  options?: Option[];
  lesson_name?: string;
  containerId?: string;
  document_id?: number;
}

interface Document {
  id: number;
  title: string;
  created_at: string;
}

interface QuestionBankManagerProps {
  initialDocuments: Document[];
}

export default function QuestionBankManager({ initialDocuments }: QuestionBankManagerProps) {
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [sourceQuestions, setSourceQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch questions when doc changes
  useEffect(() => {
    async function loadQuestions() {
      if (!activeDocId) return;
      setIsLoading(true);
      const data = await getQuestionsByDocId(activeDocId);

      const filteredData = data.filter((q: any) =>
        !selectedQuestions.some(sq => sq.id === q.id)
      );

      setSourceQuestions(filteredData.map((q: any) => ({
        ...q,
        containerId: 'source',
        document_id: activeDocId
      })));
      setIsLoading(false);
    }
    loadQuestions();
  }, [activeDocId, selectedQuestions.length]);

  const findContainer = (id: string | number) => {
    if (id === 'source' || sourceQuestions.find((q) => q.id === id)) return 'source';
    if (id === 'selected' || selectedQuestions.find((q) => q.id === id)) return 'selected';
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id as number);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    if (activeContainer === 'source' && shadowSelected(overId)) {
      moveItemBetweenContainers(active.id as number, 'source', 'selected');
    } else if (activeContainer === 'selected' && shadowSource(overId)) {
      const question = selectedQuestions.find(q => q.id === active.id);
      if (question && question.document_id === activeDocId) {
        moveItemBetweenContainers(active.id as number, 'selected', 'source');
      } else {
        setSelectedQuestions(prev => prev.filter(q => q.id !== active.id));
      }
    }
  };

  const shadowSelected = (id: any) => id === 'selected' || selectedQuestions.find(q => q.id === id);
  const shadowSource = (id: any) => id === 'source' || sourceQuestions.find(q => q.id === id);

  const moveItemBetweenContainers = (id: number, from: 'source' | 'selected', to: 'source' | 'selected') => {
    if (from === 'source') {
      const item = sourceQuestions.find(q => q.id === id);
      if (item) {
        setSourceQuestions(prev => prev.filter(q => q.id !== id));
        setSelectedQuestions(prev => [...prev, { ...item, containerId: 'selected' }]);
      }
    } else {
      const item = selectedQuestions.find(q => q.id === id);
      if (item) {
        setSelectedQuestions(prev => prev.filter(q => q.id !== id));
        setSourceQuestions(prev => [...prev, { ...item, containerId: 'source' }]);
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id as number);
    const overContainer = findContainer(over.id);

    if (activeContainer === overContainer && active.id !== over.id) {
      if (activeContainer === 'source') {
        const oldIndex = sourceQuestions.findIndex((q) => q.id === active.id);
        const newIndex = sourceQuestions.findIndex((q) => q.id === over.id);
        setSourceQuestions(arrayMove(sourceQuestions, oldIndex, newIndex));
      } else if (activeContainer === 'selected') {
        const oldIndex = selectedQuestions.findIndex((q) => q.id === active.id);
        const newIndex = selectedQuestions.findIndex((q) => q.id === over.id);
        setSelectedQuestions(arrayMove(selectedQuestions, oldIndex, newIndex));
      }
    }
  };

  const handleSaveCollection = async (title: string) => {
    const questionIds = selectedQuestions.map(q => q.id);
    const result = await createCollection(title, questionIds);

    if (result.success) {
      toast.success('Đã tạo bộ sưu tập thành công!');
      return { success: true };
    } else {
      toast.error(result.error || 'Có lỗi xảy ra');
      return { success: false, error: result.error };
    }
  };

  const activeQuestion = activeId
    ? [...sourceQuestions, ...selectedQuestions].find((q) => q.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pb-4">

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center justify-between">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              DANH SÁCH TỆP
            </h3>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
              {initialDocuments.length} tệp
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {initialDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`w-full text-left p-3 rounded-xl transition-all group flex items-center gap-3 border ${activeDocId === doc.id
                  ? 'bg-primary/5 border-primary/20 shadow-sm'
                  : 'bg-transparent border-transparent hover:bg-surface-container-low hover:border-outline-variant/30'
                  }`}
              >
                <div className={`p-2 rounded-lg ${activeDocId === doc.id ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant group-hover:text-primary'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${activeDocId === doc.id ? 'text-primary' : 'text-on-surface'}`}>
                    {doc.title}
                  </p>
                  <p className="text-[10px] text-outline mt-0.5">
                    ID: #{doc.id}
                  </p>
                </div>
                {activeDocId === doc.id && (
                  <motion.div layoutId="active-indicator">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        <DroppableColumn
          id="source"
          questions={sourceQuestions}
          title="CÂU HỎI TRONG TỆP"
          icon={Hash}
          color="secondary"
          isLoading={isLoading}
        >
          {sourceQuestions.length > 0 ? (
            sourceQuestions.map((question) => (
              <SortableQuestionItem key={question.id} question={question} />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                <Grab className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">
                {activeDocId ? 'Tập này chưa có câu hỏi hoặc đang tải...' : 'Vui lòng chọn một tệp ở cột bên trái.'}
              </p>
            </div>
          )}
        </DroppableColumn>

        <DroppableColumn
          id="selected"
          questions={selectedQuestions}
          title="CÂU HỎI ĐÃ CHỌN"
          icon={FileText}
          color="primary"
          showCount
          headerAction={
            selectedQuestions.length > 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95"
              >
                <Save className="w-3 h-3" />
                TẠO BỘ SƯU TẬP
              </button>
            )
          }
        >
          {selectedQuestions.length > 0 ? (
            selectedQuestions.map((question) => (
              <SortableQuestionItem key={question.id} question={question} />
            ))
          ) : (
            <div className="h-96 border-2 border-dashed border-outline-variant/30 rounded-3xl flex flex-col items-center justify-center text-center p-8 opacity-40">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center mb-4">
                <Grab className="w-10 h-10" />
              </div>
              <p className="text-sm font-bold uppercase">Kéo thả vào đây</p>
            </div>
          )}
        </DroppableColumn>
      </div>

      <CollectionSaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedQuestions={selectedQuestions}
        onSave={handleSaveCollection}
        onReset={() => setSelectedQuestions([])}
      />

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.4',
            },
          },
        }),
      }}>
        {activeId && activeQuestion ? (
          <div className="w-[400px] pointer-events-none opacity-90 scale-105">
            <SortableQuestionItem question={activeQuestion} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Helper components for better droppable detection
function DroppableColumn({ id, questions, title, icon: Icon, color, children, showCount, isLoading, headerAction }: any) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl border flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${id === 'selected' ? 'border-dashed border-2 border-primary/20' : 'border-outline-variant/20'
        } ${isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}
    >
      <div className={`p-4 border-b border-outline-variant/10 flex items-center justify-between ${color === 'primary' ? 'bg-primary/5' : 'bg-surface-container-low/50'
        }`}>
        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-outline" />}
          {showCount && (
            <span className="text-[10px] font-bold bg-primary text-on-primary px-2 py-0.5 rounded-full uppercase">
              {questions.length} items
            </span>
          )}
          {headerAction}
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin ${color === 'primary' ? 'scrollbar-thumb-primary/20 bg-primary/[0.02]' : 'scrollbar-thumb-outline-variant/30'
        }`}>
        <SortableContext items={questions.map((q: any) => q.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </div>
    </div>
  );
}
