import { useQuery } from '@tanstack/react-query';
import { getQuestionRequests, RequestType, RequestStatus } from '@/actions/question-request';

export interface QuestionRequestsQueryParams {
  types: RequestType[];
  statuses: RequestStatus[];
  page: number;
  pageSize: number;
}

export function useQuestionRequestsQuery(params: QuestionRequestsQueryParams) {
  const { types, statuses, page, pageSize } = params;

  return useQuery({
    queryKey: ['questionRequests', { types, statuses, page, pageSize }],
    queryFn: () => getQuestionRequests({ types, statuses }, page, pageSize),
  });
}
