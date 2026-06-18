import { useQuery } from '@tanstack/react-query';
import { getQuestionsByDocIdAction, getLibraryQuestionsAction } from '@/actions/question.action';

export interface QuestionsQueryParams {
  activeDocId: number | null;
  grades: number[];
  difficulties: string[];
  questionTypes: string[];
  topicIds: number[];
  tagIds: number[];
  keyword: string;
  page: number;
  pageSize: number;
  excludeIds?: number[];
}

export function useQuestionsQuery(params: QuestionsQueryParams, enabled: boolean = true) {
  const {
    activeDocId,
    grades,
    difficulties,
    questionTypes,
    topicIds,
    tagIds,
    keyword,
    page,
    pageSize,
    excludeIds = [],
  } = params;

  return useQuery({
    queryKey: [
      'questions',
      {
        activeDocId,
        grades,
        difficulties,
        questionTypes,
        topicIds,
        tagIds,
        keyword,
        page,
        pageSize,
      },
    ],
    queryFn: async () => {
      if (activeDocId) {
        const res = await getQuestionsByDocIdAction(activeDocId, page, pageSize, excludeIds);
        return res.success ? res.data : { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
      } else {
        const res = await getLibraryQuestionsAction(
          page,
          pageSize,
          { grades, difficulties, questionTypes, topicIds, tagIds, keyword },
          excludeIds
        );
        return res.success ? res.data : { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
      }
    },
    enabled,
  });
}
