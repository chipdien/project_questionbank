import { useQuery } from '@tanstack/react-query';
import { getDifficultiesAction, Difficulty } from '@/actions/difficulty.action';

export function useDifficultiesQuery(initialData?: Difficulty[]) {
  return useQuery<Difficulty[]>({
    queryKey: ['difficulties'],
    queryFn: async () => {
      const response = await getDifficultiesAction();
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi lấy danh sách độ khó.');
      }
      return response.data || [];
    },
    initialData,
  });
}
