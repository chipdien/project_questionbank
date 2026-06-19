import { useQuery } from '@tanstack/react-query';
import { getAllQuestionsAction } from '@/lib/actions/question-list.action';

export interface QuestionListQueryParams {
  page: number;
  pageSize: number;
  grades: number[];
  questionTypes: string[];
  topicIds: number[];
  tagIds: number[];
  keyword: string;
  unclassified: boolean;
  prioritizeRequests?: boolean;
}

export function useQuestionListQuery(params: QuestionListQueryParams) {
  const {
    page,
    pageSize,
    grades,
    questionTypes,
    topicIds,
    tagIds,
    keyword,
    unclassified,
    prioritizeRequests = false,
  } = params;

  return useQuery({
    queryKey: [
      'questionList',
      {
        page,
        grades,
        questionTypes,
        topicIds,
        tagIds,
        keyword,
        unclassified,
        prioritizeRequests,
      },
    ],
    queryFn: async () => {
      const res = await getAllQuestionsAction(
        page,
        pageSize,
        { grades, questionTypes, topicIds, tagIds, keyword, unclassified },
        { prioritizeRequests }
      );
      return res.success
        ? res.data
        : { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0, difficulties: [] };
    },
  });
}
