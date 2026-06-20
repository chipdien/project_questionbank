export type WizardStep = 'upload' | 'processing' | 'classify' | 'complete';

export interface TagItem {
  id: number;
  name: string;
  category: string;
}

export interface ImportWizardProps {
  recentDocuments: any[];
  lessons: any[];
  difficulties: any[];
  topics: any[];
  tagsByCategory: Record<string, any[]>;
  currentUserId: number | null;
  isAdmin?: boolean;
}

export interface SplitWorkspaceProps {
  files: File[];
  linkS3: string | null;
  documentTitle: string;
  questions: any[];
  onQuestionUpdate: (updatedQuestion: any) => void;
  difficulties: any[];
  tagsByCategory: Record<string, any[]>;
  onApplyClassification: (classification: any) => Promise<void>;
  currentUserId: number | null;
  isAdmin?: boolean;
  onNextStep: () => void;
  onBack: () => void;
  onAIClassify: () => Promise<{ success: boolean; error?: string; count?: number }>;
  isAIClassified: boolean;
}

export interface CollapsibleClassificationProps {
  selectedIds: Set<number>;
  activeQuestion: any | null;
  difficulties: any[];
  tagsByCategory: Record<string, TagItem[]>;
  onApply: (classification: {
    grade?: string | null;
    difficulty?: string | null;
    topicIds?: string[] | null;
    tagIds?: number[] | null;
  }) => Promise<void>;
  className?: string;
}

export interface QuestionDataListProps {
  questions: any[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  activeId: number | null;
  onActiveChange: (id: number | null) => void;
  onQuestionUpdate: (updatedQuestion: any) => void;
  currentUserId: number | null;
  isAdmin?: boolean;
  difficulties: any[];
}

export interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  recentDocuments: any[];
  onSelectRecentDocument: (docId: number) => void;
  onEditRecentDocument: (docId: number) => void;
  isProcessing: boolean;
  onSubmit: () => void;
  selectedDocId?: number | null;
  currentUserId: number | null;
  isAdmin: boolean;
}

export interface UseImportWizardProps {
  currentUserId: number | null;
  isAdmin: boolean;
}

export interface UseFileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  recentDocuments: any[];
  isProcessing: boolean;
  currentUserId: number | null;
  isAdmin: boolean;
}

export interface UseCollapsibleClassificationProps {
  selectedIds: Set<number>;
  activeQuestion: any | null;
  tagsByCategory: Record<string, TagItem[]>;
  onApply: (classification: {
    grade?: string | null;
    difficulty?: string | null;
    topicIds?: string[] | null;
    tagIds?: number[] | null;
  }) => Promise<void>;
}

export interface UseQuestionDataListProps {
  questions: any[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  activeId: number | null;
  onActiveChange: (id: number | null) => void;
  onQuestionUpdate: (updatedQuestion: any) => void;
  difficulties: any[];
}

export interface AIClassifyOverlayProps {
  isProcessing: boolean;
  currentStepIndex: number;
}

export interface ProcessingOverlayProps {
  isProcessing: boolean;
  currentStepIndex: number;
}

export interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  questionsCount: number;
  onComplete: (isPublic: boolean) => Promise<void>;
}

export interface OriginalPreviewProps {
  files: File[];
  linkS3: string | null;
  documentTitle?: string;
}
