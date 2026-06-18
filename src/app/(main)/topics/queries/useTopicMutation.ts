import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createTopicAction, 
  updateTopicAction, 
  deleteTopicAction, 
  bulkDeleteTopicsAction, 
  bulkMoveTopicsAction, 
  transferQuestionsAction 
} from '@/actions/topics.action';
import { Topic } from './useTopicsQuery';

export function useCreateTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Topic>) => {
      const response = await createTopicAction({
        title: data.title,
        type: data.type,
        content: data.content,
        code: data.code,
        parent_id: data.parent_id ? Number(data.parent_id) : null,
        subject_id: data.subject_id ? Number(data.subject_id) : null,
        syllabus_id: data.syllabus_id ? Number(data.syllabus_id) : null,
        order_index: data.order_index ? Number(data.order_index) : null,
      });

      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi tạo chủ đề.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useUpdateTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Topic> }) => {
      const response = await updateTopicAction(Number(id), {
        title: data.title,
        type: data.type,
        content: data.content,
        code: data.code,
        parent_id: data.parent_id ? Number(data.parent_id) : null,
        subject_id: data.subject_id ? Number(data.subject_id) : null,
        syllabus_id: data.syllabus_id ? Number(data.syllabus_id) : null,
        order_index: data.order_index ? Number(data.order_index) : null,
      });

      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi cập nhật chủ đề.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}

export function useDeleteTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await deleteTopicAction(Number(id));
      if (!response.success) {
        const err: any = new Error(response.error || 'Có lỗi xảy ra khi xóa chủ đề.');
        err.code = response.code;
        err.details = response.data;
        throw err;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}

export function useBulkDeleteTopicsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicIds: string[]) => {
      const response = await bulkDeleteTopicsAction(topicIds.map(Number));
      if (!response.success) {
        const err: any = new Error(response.error || 'Có lỗi xảy ra khi xóa hàng loạt.');
        err.code = response.code;
        err.details = response.data;
        throw err;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}

export function useBulkMoveTopicsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ topicIds, targetParentId }: { topicIds: string[]; targetParentId: string | null }) => {
      const response = await bulkMoveTopicsAction(
        topicIds.map(Number), 
        targetParentId ? Number(targetParentId) : null
      );
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi di chuyển chủ đề.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useTransferQuestionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: { target_topic_id: string; include_subtopics: boolean } }) => {
      const response = await transferQuestionsAction(
        Number(id), 
        Number(data.target_topic_id), 
        data.include_subtopics
      );
      if (!response.success) {
        throw new Error(response.error || 'Có lỗi xảy ra khi chuyển câu hỏi.');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
    },
  });
}
