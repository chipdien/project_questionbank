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
  difficulties: string[];
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
    difficulties,
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
        difficulties,
      },
    ],
    queryFn: async () => {
      const res = await getAllQuestionsAction(
        page,
        pageSize,
        { grades, questionTypes, topicIds, tagIds, keyword, unclassified, difficulties },
        { prioritizeRequests }
      );
      return res.success
        ? res.data
        : { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0, difficulties: [] };
    },
  });
}
