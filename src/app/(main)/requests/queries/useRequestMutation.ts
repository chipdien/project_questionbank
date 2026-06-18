import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelQuestionRequest, approveQuestionRequest, rejectQuestionRequest } from '@/actions/question-request';

export function useCancelRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelQuestionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionRequests'] });
    },
  });
}

export function useApproveRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => approveQuestionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useRejectRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectQuestionRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['questionList'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}
