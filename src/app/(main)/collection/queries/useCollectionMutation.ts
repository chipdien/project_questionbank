import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCollection, addQuestionsToCollection } from '@/actions/collection.action';

/**
 * Hook for creating a new collection
 */
export function useCreateCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, questionIds }: { title: string; questionIds: number[] }) => {
      const response = await createCollection(title, questionIds);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi tạo bộ sưu tập.');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both general collections and my collections queries
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });
}

/**
 * Hook for adding questions to an existing collection
 */
export function useAddQuestionsToCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, questionIds }: { collectionId: number; questionIds: number[] }) => {
      const response = await addQuestionsToCollection(collectionId, questionIds);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi thêm vào bộ sưu tập.');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate collections queries
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
      // Invalidate the questions inside the updated collection
      queryClient.invalidateQueries({ queryKey: ['collectionQuestions', variables.collectionId] });
    },
  });
}
