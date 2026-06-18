import { useQuery } from '@tanstack/react-query';
import { getMyCollections } from '@/actions/collection.action';

/**
 * Hook for fetching current user's collections
 */
export function useMyCollectionsQuery() {
  return useQuery({
    queryKey: ['myCollections'],
    queryFn: async () => {
      const response = await getMyCollections();
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi lấy danh sách bộ sưu tập.');
      }
      return response.data || [];
    },
  });
}
