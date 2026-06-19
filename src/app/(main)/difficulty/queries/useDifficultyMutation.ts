import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDifficultyAction, updateDifficultyAction, deleteDifficultyAction } from '@/lib/actions/difficulty.action';

export function useAddDifficultyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, colorCode, displayOrder }: { name: string; colorCode: string; displayOrder: number }) => {
      const response = await addDifficultyAction(name, colorCode, displayOrder);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi thêm độ khó.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['difficulties'] });
    },
  });
}

export function useUpdateDifficultyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      oldName,
      newName,
      colorCode,
      displayOrder,
    }: {
      id: number;
      oldName: string;
      newName: string;
      colorCode: string;
      displayOrder: number;
    }) => {
      const response = await updateDifficultyAction(id, oldName, newName, colorCode, displayOrder);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi cập nhật độ khó.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['difficulties'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}

export function useDeleteDifficultyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, replacementName }: { id: number; name: string; replacementName: string }) => {
      const response = await deleteDifficultyAction(id, name, replacementName);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi xóa độ khó.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['difficulties'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}
