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
  content?: string | null;
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
  pdf_url?: string | null;
  link_s3?: string | null;
  public?: string | null;
  teacher_name?: string | null;
  teacher_owned?: number | null;
  created_by_id?: number | null;
}

export interface Lesson {
  id: number;
  name: string;
  grade?: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}
