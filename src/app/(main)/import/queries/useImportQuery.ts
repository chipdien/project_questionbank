import { useQuery } from '@tanstack/react-query';
import { getQuestionsByDocIdAction } from '@/lib/actions/question.action';
import { getDocumentById } from '@/lib/actions/document-library.action';

export function useImportQuestionsQuery(docId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['import-questions', docId],
    queryFn: async () => {
      if (!docId) return [];
      const response = await getQuestionsByDocIdAction(docId, 1, 100);
      if (!response.success) {
        throw new Error(response.error || 'Không thể tải danh sách câu hỏi.');
      }
      return response.data?.data || [];
    },
    enabled: !!docId && enabled,
  });
}

export function useImportDocumentQuery(docId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['import-document', docId],
    queryFn: async () => {
      if (!docId) return null;
      const response = await getDocumentById(docId);
      if (!response.success) {
        throw new Error(response.error || 'Không thể tải thông tin tài liệu.');
      }
      return response.data;
    },
    enabled: !!docId && enabled,
  });
}
