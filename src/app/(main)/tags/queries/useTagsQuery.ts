import { useQuery } from '@tanstack/react-query';
import { getTagsAction } from '@/lib/actions/tags.action';
import { Tag } from '@/lib/types/tag.type';

export function useTagsQuery(params?: { category?: string }) {
  return useQuery<Tag[]>({
    queryKey: ['tags', params],
    queryFn: async () => {
      const response = await getTagsAction(params?.category);
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi lấy danh sách thẻ tag.');
      }
      return response.data || [];
    },
  });
}
