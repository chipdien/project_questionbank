import { useMutation, useQueryClient } from '@tanstack/react-query';
import { classifyQuestionsAction } from '@/lib/actions/question.action';
import { updateDocumentVisibility } from '@/lib/actions/document-library.action';
import { autoClassifyWithAI } from '@/lib/actions/ai-classify.action';

export function useClassifyQuestionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionIds,
      classification,
    }: {
      questionIds: number[];
      classification: any;
    }) => {
      const response = await classifyQuestionsAction(questionIds, classification);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi phân loại câu hỏi.');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries để tải lại danh sách câu hỏi
      queryClient.invalidateQueries({ queryKey: ['import-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}

export function useUpdateDocVisibilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      isPublic,
    }: {
      documentId: number;
      isPublic: boolean;
    }) => {
      const response = await updateDocumentVisibility(documentId, isPublic);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi cập nhật chế độ chia sẻ.');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-document'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useAIClassifyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      const response = await autoClassifyWithAI(documentId);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi phân loại bằng AI.');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-questions'] });
      queryClient.invalidateQueries({ queryKey: ['import-document'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
