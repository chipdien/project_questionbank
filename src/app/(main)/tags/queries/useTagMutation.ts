import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTagAction, updateTagAction, deleteTagAction } from '@/lib/actions/tags.action';
import { Tag } from './useTagsQuery';

export function useCreateTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; category: string }) => {
      const response = await createTagAction(data.name, data.category);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi tạo thẻ tag.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Tag> }) => {
      const response = await updateTagAction(Number(id), data.name, data.category);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi cập nhật thẻ tag.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      // Invalidate questions queries as tag update might affect questions details page
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}

export function useDeleteTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await deleteTagAction(Number(id));
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi xóa thẻ tag.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}
