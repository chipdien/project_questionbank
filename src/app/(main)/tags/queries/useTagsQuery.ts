import { useQuery } from '@tanstack/react-query';
import { getTagsAction } from '@/actions/tags.action';

export interface Tag {
  id: string;
  name: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

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
