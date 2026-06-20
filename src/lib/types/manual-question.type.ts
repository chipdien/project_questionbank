import React from 'react';

export interface Difficulty {
  id: number;
  name: string;
  color_code: string;
}

export interface Tag {
  id: number;
  name: string;
  category: string;
}

export interface Topic {
  id: number;
  title: string;
  parent_id: number | null;
  path: string;
}

export interface Option {
  content: string;
  order: number;
  weight: number;
}

export interface Collection {
  id: number;
  title: string;
  question_count?: number;
}

export interface UseQuestionCreatorProps {
  difficulties: Difficulty[];
  initialCollections?: any[];
}

export interface QuestionCreatorProps {
  difficulties: Difficulty[];
  tags: Tag[];
  topics: Topic[];
  initialCollections?: any[];
}

export interface AnswerFormProps {
  questionType: string;
  statement: string;
  options: Option[];
  setOptions: React.Dispatch<React.SetStateAction<Option[]>>;
  hint: string;
  setHint: (hint: string) => void;
}

export interface UseAnswerFormProps {
  questionType: string;
  statement: string;
  options: Option[];
  setOptions: React.Dispatch<React.SetStateAction<Option[]>>;
}

export interface SaveCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onConfirm: (collectionId?: number, newTitle?: string) => void;
  isSaving: boolean;
}

export interface ClassificationSidebarProps {
  difficulties: Difficulty[];
  tags: Tag[];
  topics: Topic[];
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (difficulty: string) => void;
  selectedTopicIds: number[];
  setSelectedTopicIds: (ids: number[]) => void;
  selectedTagIds: number[];
  setSelectedTagIds: (ids: number[]) => void;
  questionType?: string;
  setQuestionType?: (type: string) => void;
  isSaving?: boolean;
}
