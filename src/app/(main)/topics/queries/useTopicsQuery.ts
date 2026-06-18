import { useQuery } from '@tanstack/react-query';
import { getTopicsAction } from '@/lib/actions/topics.action';

export interface Topic {
  id: string;
  title: string | null;
  code: string | null;
  content: string | null;
  parent_id: string | null;
  path: string | null;
  order_index: string | null;
  subject_id: string | null;
  syllabus_id: string | null;
  type: string | null;
  created_at?: string;
  updated_at?: string;
  _count?: {
    questions: number;
  };
}

export interface RelatedData {
  topic_id: string;
  title: string | null;
  subtopics_count: number;
  subtopics: Topic[];
  questions_count: number;
  questions: {
    id: string;
    code: string | null;
    statement: string | null;
  }[];
}

export function useTopicsQuery() {
  return useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await getTopicsAction();
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi lấy danh sách chủ đề.');
      }
      return response.data || [];
    },
  });
}
