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
import SortableQuestionItem from '@/app/(main)/question-bank/components/SortableQuestionItem';
import { getQuestionsByDocId, getLibraryQuestions } from '@/actions/question';
import { createCollection } from '@/actions/collection';
import CollectionSaveModal from '@/app/(main)/collection/components/CollectionSaveModal';
import { FileText, ChevronRight, Hash, Layers, Loader2, Grab, Save, Filter, Search, GraduationCap, BarChart, BookOpen, ChevronDown, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface Lesson {
  id: number;
  name: string;
  grade?: string;
}

interface QuestionBankManagerProps {
  initialDocuments: Document[];
  lessons: Lesson[];
}

export default function QuestionBankManager({ initialDocuments, lessons }: QuestionBankManagerProps) {
  const [activeDocId, setActiveDocId] = useState<number | null>(null);

  // States for filters
  const [grade, setGrade] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');

  const [sourceQuestions, setSourceQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 30;

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

  // Handle document selection - reset filters and page
  const handleDocClick = (docId: number) => {
    setActiveDocId(docId);
    setGrade('');
    setLessonId('');
    setDifficulty('');
    setPage(1);
  };

  // Handle filter change - reset activeDocId and page
  const handleFilterChange = (field: 'grade' | 'lessonId' | 'difficulty', value: string) => {
    if (field === 'grade') setGrade(value);
    if (field === 'lessonId') setLessonId(value);
    if (field === 'difficulty') setDifficulty(value);

    // Reset activeDocId when any filter is selected
    if (value !== '') {
      setActiveDocId(null);
    }
    setPage(1);
  };

  // Fetch questions when activeDocId, page or filters change
  useEffect(() => {
    async function loadQuestions() {
      // If neither doc nor filters are active, clear source questions
      if (!activeDocId && !grade && !lessonId && !difficulty) {
        setSourceQuestions([]);
        setTotalPages(0);
        return;
      }

      setIsLoading(true);
      let result: any;
      const excludeIds = selectedQuestions.map(q => q.id);

      if (activeDocId) {
        // Mode: Fetch from document
        result = await getQuestionsByDocId(activeDocId, page, PAGE_SIZE, excludeIds);
      } else {
        // Mode: Fetch from library with filters
        result = await getLibraryQuestions(page, PAGE_SIZE, { grade, difficulty, lessonId }, excludeIds);
      }

      const data = result.data || [];
      setTotalPages(result.totalPages || 0);

      setSourceQuestions(data.map((q: any) => ({
        ...q,
        containerId: 'source',
        document_id: activeDocId || undefined
      })));
      setIsLoading(false);
    }
    loadQuestions();
  }, [activeDocId, grade, lessonId, difficulty, selectedQuestions.length, page]);

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
      // If doc mode, check if it belongs to current doc. If filter mode, always allow back move to source.
      if (question && (activeDocId === null || question.document_id === activeDocId)) {
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

  const isFiltering = grade !== '' || lessonId !== '' || difficulty !== '';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">

        {/* Cột 1: Bộ lọc & Danh sách tệp */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">

          {/* Section: BỘ LỌC CÂU HỎI */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 text-primary">
                <Filter className="w-4 h-4" />
                BỘ LỌC CÂU HỎI
              </h3>
              {isFiltering && (
                <button
                  onClick={() => { setGrade(''); setLessonId(''); setDifficulty(''); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-all text-[10px] font-black uppercase cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Xóa lọc
                </button>
              )}
            </div>
            <div className="p-5 space-y-5 bg-gradient-to-b from-transparent to-surface-container-low/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-primary/70" />
                    Khối lớp
                  </label>
                  <div className="relative group/select">
                    <select
                      value={grade}
                      onChange={(e) => handleFilterChange('grade', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer hover:bg-surface-container-low hover:border-primary/30"
                    >
                      <option value="">Chọn khối lớp</option>
                      {[6, 7, 8, 9, 10, 11, 12].map(g => (
                        <option key={g} value={g.toString()}>Khối {g}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant pointer-events-none group-hover/select:text-primary transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1 flex items-center gap-2">
                    <BarChart className="w-3.5 h-3.5 text-primary/70" />
                    Độ khó
                  </label>
                  <div className="relative group/select">
                    <select
                      value={difficulty}
                      onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer hover:bg-surface-container-low hover:border-primary/30"
                    >
                      <option value="">Chọn độ khó</option>
                      <option value="Dễ">Dễ</option>
                      <option value="Trung Bình">Trung Bình</option>
                      <option value="Khó">Khó</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant pointer-events-none group-hover/select:text-primary transition-colors" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary/70" />
                  Bài học
                </label>
                <div className="relative group/select">
                  <select
                    value={lessonId}
                    onChange={(e) => handleFilterChange('lessonId', e.target.value)}
                    disabled={!grade}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer hover:bg-surface-container-low hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-container-low/50"
                  >
                    <option value="">{!grade ? "Chưa chọn khối lớp" : "Chọn bài học"}</option>
                    {lessons.filter(l => !grade || l.grade === grade).map(lesson => (
                      <option key={lesson.id} value={lesson.id.toString()}>{lesson.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant pointer-events-none group-hover/select:text-primary transition-colors group-disabled:opacity-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: DANH SÁCH TỆP */}
          <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                DANH SÁCH TỆP
              </h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-xl uppercase">
                {initialDocuments.length} tệp
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {initialDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleDocClick(doc.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all group flex items-center gap-3 border ${activeDocId === doc.id
                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-surface-container-low hover:border-outline-variant/30'
                    }`}
                >
                  <div className={`p-2 rounded-xl ${activeDocId === doc.id ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant group-hover:text-primary'}`}>
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
        </div>

        {/* Cột 2: Câu hỏi nguồn */}
        <DroppableColumn
          id="source"
          questions={sourceQuestions}
          title={isFiltering ? "CÂU HỎI TÌM ĐƯỢC" : "CÂU HỎI TRONG TỆP"}
          icon={isFiltering ? Search : Hash}
          color="secondary"
          isLoading={isLoading}
        >
          {sourceQuestions.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                {sourceQuestions.map((question) => (
                  <SortableQuestionItem key={question.id} question={question} />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest sticky bottom-0 z-10">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="p-2 rounded-xl hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-outline-variant/20"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-outline-variant uppercase tracking-tighter">Trang</span>
                    <span className="text-xs font-black text-primary">{page} / {totalPages}</span>
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                    className="p-2 rounded-xl hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-outline-variant/20"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <div className="w-16 h-16 rounded-xl bg-surface-container-highest flex items-center justify-center mb-4">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Grab className="w-8 h-8" />}
              </div>
              <p className="text-sm font-medium">
                {activeDocId
                  ? 'Tập này chưa có câu hỏi hoặc đang tải...'
                  : isFiltering
                    ? 'Không tìm thấy câu hỏi nào phù hợp với bộ lọc.'
                    : 'Hệ thống hiển thị kết quả lọc hoặc nội dung tệp ở đây. Vui lòng thao tác ở cột bên trái.'}
              </p>
            </div>
          )}
        </DroppableColumn>

        {/* Cột 3: Câu hỏi đã chọn */}
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-xl text-[10px] font-bold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95"
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
            <div className="h-96 border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center p-8 opacity-40">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center mb-4">
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
      className={`col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl border flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${id === 'selected' ? 'border-dashed border-2 border-primary/20' : 'border-outline-variant/20'
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
            <span className="text-[10px] font-bold bg-primary text-on-primary px-2 py-0.5 rounded-xl uppercase">
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

