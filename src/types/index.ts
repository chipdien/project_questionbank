export interface Option {
  id: number;
  question_id: number;
  content: string;
  order: number;
  weight: number;
}

export interface Question {
  id: number;
  statement: string;
  grade: string;
  question_difficulty: string;
  question_type: string;
  created_at?: string;
  options?: Option[];
  lesson_name?: string;
  containerId?: string;
  document_id?: number;
}

export interface Document {
  id: number;
  title: string;
  created_at: string;
  is_ai_classified?: number;
  pdf_url?: string;
  public?: string | null;
}

export interface Lesson {
  id: number;
  name: string;
  grade?: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  pageSize: number;
}
