'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/utils/auth.utils';
import { serializeBigInt } from '@/lib/utils/serialization.utils';
import {
  resolveTopicQuestionIds,
  getQuestionIdsByTags,
} from '@/lib/services/question-filters.service';

export interface QuestionListFilters {
  grades?: number[];
  questionTypes?: string[];
  topicIds?: number[];
  tagIds?: number[];
  keyword?: string;
  unclassified?: boolean;
  difficulties?: string[];
}

export async function getAllQuestions(
  page: number = 1,
  pageSize: number = 50,
  filters: QuestionListFilters = {},
  options: { prioritizeRequests?: boolean } = {}
) {
  const {
    grades = [],
    questionTypes = [],
    topicIds = [],
    tagIds = [],
    keyword = '',
    unclassified = false,
    difficulties = [],
  } = filters;

  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? null;
    const isAdmin = (user?.level_rank ?? 0) >= 5;

    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Number(pageSize));
    const offset = (safePage - 1) * safePageSize;

    const whereClause: any = { AND: [] };

    // 1. Visibility / phân quyền
    if (!isAdmin) {
      const orVisibility: any[] = [{ public: '1' }, { public: null }];
      if (userId !== null) {
        orVisibility.push(
          { created_by_id: BigInt(userId) },
          { owned_by_id: BigInt(userId) },
          { teacher_owned_by_id: BigInt(userId) },
        );
      }
      whereClause.AND.push({ OR: orVisibility });
    }
    // Admin: không thêm điều kiện public → thấy cả private ('0').

    // 2. Ẩn câu con chùm 'sub'
    whereClause.AND.push({ OR: [{ complex: { not: 'sub' } }, { complex: null }] });

    // 3. Lọc grade / question_type / keyword / difficulty
    if (grades.length > 0) whereClause.grade = { in: grades.map(Number) };
    if (questionTypes.length > 0) whereClause.question_type = { in: questionTypes };
    if (difficulties.length > 0) whereClause.question_difficulty = { in: difficulties };
    if (keyword) {
      whereClause.AND.push({
        OR: [{ statement: { contains: keyword } }, { content: { contains: keyword } }],
      });
    }

    // 4. Ràng buộc theo tập id (topic + tag), giao nhau nếu cả hai
    let idConstraint: bigint[] | null = null;
    if (topicIds.length > 0) {
      idConstraint = await resolveTopicQuestionIds(topicIds);
    }
    if (tagIds.length > 0) {
      const tagMatch = await getQuestionIdsByTags(tagIds);
      if (idConstraint === null) {
        idConstraint = tagMatch;
      } else {
        const tagSet = new Set(tagMatch.map(String));
        idConstraint = idConstraint.filter(id => tagSet.has(id.toString()));
      }
    }

    // 5. Bộ lọc "chưa phân loại" = thiếu topic HOẶC thiếu tag → lọc thẳng bằng SQL
    // (trước đây nạp toàn bộ ~40k+ quan hệ topic/tag vào RAM rồi dựng notIn khổng lồ).
    if (unclassified) {
      whereClause.AND.push({
        OR: [{ topics: { none: {} } }, { tags: { none: {} } }],
      });
    }

    if (idConstraint !== null) whereClause.id = { in: idConstraint };

    if (whereClause.AND.length === 0) delete whereClause.AND;

    // 6. Đếm + phân trang
    const total = await prisma.lms_questions.count({ where: whereClause });

    // Map question_id -> pending request count (only when prioritizing)
    const pendingCountMap = new Map<string, number>();
    let requestedOrdered: bigint[] = [];

    if (options.prioritizeRequests) {
      const grouped = await prisma.lms_requests.groupBy({
        by: ['question_id'],
        where: { status: 'PENDING', question_id: { not: null } },
        _count: { _all: true },
      });
      const reqIds: bigint[] = [];
      for (const g of grouped) {
        if (g.question_id != null) {
          pendingCountMap.set(g.question_id.toString(), g._count._all);
          reqIds.push(g.question_id);
        }
      }
      if (reqIds.length > 0) {
        const requestedRows = await prisma.lms_questions.findMany({
          where: { AND: [whereClause, { id: { in: reqIds } }] },
          select: { id: true },
          orderBy: { id: 'desc' },
        });
        requestedOrdered = requestedRows.map(r => r.id);
      }
    }

    let questionsRaw: any[];
    if (options.prioritizeRequests && requestedOrdered.length > 0) {
      const rCount = requestedOrdered.length;
      const seg1Ids = requestedOrdered.slice(offset, offset + safePageSize);
      let seg1Rows: any[] = [];
      if (seg1Ids.length > 0) {
        const fetched = await prisma.lms_questions.findMany({ where: { id: { in: seg1Ids } } });
        const byId = new Map(fetched.map(q => [q.id.toString(), q]));
        seg1Rows = seg1Ids.map(id => byId.get(id.toString())).filter(Boolean) as any[];
      }
      const remainingTake = safePageSize - seg1Rows.length;
      let seg2Rows: any[] = [];
      if (remainingTake > 0) {
        const seg2Skip = Math.max(0, offset - rCount);
        seg2Rows = await prisma.lms_questions.findMany({
          where: { AND: [whereClause, { id: { notIn: requestedOrdered } }] },
          orderBy: { id: 'desc' },
          skip: seg2Skip,
          take: remainingTake,
        });
      }
      questionsRaw = [...seg1Rows, ...seg2Rows];
    } else {
      questionsRaw = await prisma.lms_questions.findMany({
        where: whereClause,
        orderBy: { id: 'desc' },
        skip: offset,
        take: safePageSize,
      });
    }

    // 7. Người tạo (lms_users theo created_by_id)
    const creatorIds = Array.from(
      new Set(questionsRaw.map(q => q.created_by_id).filter((v): v is bigint => v !== null)),
    ).map(id => Number(id));
    const creators = creatorIds.length
      ? await prisma.lms_users.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, username: true, nickname: true },
      })
      : [];
    const creatorMap = new Map(creators.map(u => [u.id, u.nickname || u.username]));

    // 8. Độ khó (màu badge)
    const dbDifficulties = await prisma.lms_difficulties.findMany({
      select: { name: true, color_code: true },
    });

    // 9. Làm giàu từng câu hỏi (options, tags, topics dạng nested cho QuestionModal)
    // Lấy câu hỏi con (sub_questions) cho các câu hỏi chính (main)
    const mainQuestionIds = questionsRaw.filter(q => q.complex === 'main').map(q => q.id);
    let subQuestionsRaw: any[] = [];
    if (mainQuestionIds.length > 0) {
      subQuestionsRaw = await prisma.lms_questions.findMany({
        where: { ref_question_id: { in: mainQuestionIds }, complex: 'sub' },
        orderBy: { id: 'asc' },
      });
    }

    // Kết hợp tất cả câu hỏi để fetch gộp options, tags, topics
    const allQuestionIds = [
      ...questionsRaw.map(q => q.id),
      ...subQuestionsRaw.map(sub => sub.id)
    ];

    const [allOptions, allTagsRelations, allTopicsRelations] = await Promise.all([
      prisma.lms_options.findMany({
        where: { question_id: { in: allQuestionIds } },
        orderBy: { order: 'asc' },
      }),
      prisma.lms_questions_tags.findMany({
        where: { question_id: { in: allQuestionIds } },
        include: { tag: true },
      }),
      prisma.lms_topics_questions.findMany({
        where: { question_id: { in: allQuestionIds } },
        include: { topic: true },
      })
    ]);

    // Group options by question_id
    const optionsMap = new Map<string, any[]>();
    for (const opt of allOptions) {
      if (!opt.question_id) continue;
      const qIdStr = opt.question_id.toString();
      if (!optionsMap.has(qIdStr)) optionsMap.set(qIdStr, []);
      optionsMap.get(qIdStr)!.push(opt);
    }

    // Group tags by question_id
    const tagsMap = new Map<string, any[]>();
    for (const r of allTagsRelations) {
      const qIdStr = r.question_id.toString();
      if (!tagsMap.has(qIdStr)) tagsMap.set(qIdStr, []);
      tagsMap.get(qIdStr)!.push({
        id: Number(r.tag.id),
        name: r.tag.name,
        category: r.tag.category,
      });
    }

    // Group topics by question_id
    const topicsMap = new Map<string, any[]>();
    for (const r of allTopicsRelations) {
      const qIdStr = r.question_id.toString();
      if (!topicsMap.has(qIdStr)) topicsMap.set(qIdStr, []);
      topicsMap.get(qIdStr)!.push({
        topic_id: Number(r.topic_id),
        topic: {
          id: Number(r.topic.id),
          title: r.topic.title ?? '',
          code: r.topic.code ?? null,
        },
      });
    }

    // Group sub-questions by ref_question_id
    const subQuestionsMap = new Map<string, any[]>();
    for (const sub of subQuestionsRaw) {
      if (!sub.ref_question_id) continue;
      const refIdStr = sub.ref_question_id.toString();
      if (!subQuestionsMap.has(refIdStr)) subQuestionsMap.set(refIdStr, []);

      const subIdStr = sub.id.toString();
      subQuestionsMap.get(refIdStr)!.push({
        ...sub,
        options: optionsMap.get(subIdStr) || [],
      });
    }

    const questions: any[] = [];
    for (const q of questionsRaw) {
      const qIdStr = q.id.toString();
      const tags = tagsMap.get(qIdStr) || [];
      const topics = topicsMap.get(qIdStr) || [];

      const qObj: any = {
        ...q,
        options: optionsMap.get(qIdStr) || [],
        tags,
        topics,
        created_by_name: q.created_by_id ? creatorMap.get(Number(q.created_by_id)) ?? null : null,
        isClassified: topics.length > 0 && tags.length > 0,
        pendingRequestCount: pendingCountMap.get(q.id.toString()) ?? 0,
      };

      if (q.complex === 'main') {
        qObj.sub_questions = subQuestionsMap.get(qIdStr) || [];
      }

      questions.push(qObj);
    }

    return serializeBigInt({
      data: questions,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
      difficulties: dbDifficulties.map(d => ({ name: d.name, color_code: d.color_code ?? '#888888' })),
    });
  } catch (error: any) {
    console.error('Error in getAllQuestions:', error?.message);
    return { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0, difficulties: [] };
  }
}

/**
 * Lấy 1 câu hỏi đầy đủ (options, tags, topics) để mở trong QuestionEditModal.
 * Dùng khi admin muốn sửa trực tiếp câu hỏi từ modal xử lý yêu cầu.
 */
export async function getQuestionById(id: number) {
  try {
    const q = await prisma.lms_questions.findUnique({ where: { id: BigInt(id) } });
    if (!q) return null;

    // 3 truy vấn độc lập → chạy song song thay vì tuần tự
    const [options, tagRels, topicRels] = await Promise.all([
      prisma.lms_options.findMany({
        where: { question_id: q.id },
        orderBy: { order: 'asc' },
      }),
      prisma.lms_questions_tags.findMany({
        where: { question_id: q.id },
        include: { tag: true },
      }),
      prisma.lms_topics_questions.findMany({
        where: { question_id: q.id },
        include: { topic: true },
      }),
    ]);

    const tags = tagRels.map(r => ({
      id: Number(r.tag.id),
      name: r.tag.name,
      category: r.tag.category,
    }));

    const topics = topicRels.map(r => ({
      topic_id: Number(r.topic_id),
      topic: {
        id: Number(r.topic.id),
        title: r.topic.title ?? '',
        code: r.topic.code ?? null,
      },
    }));

    return serializeBigInt({ ...q, options, tags, topics });
  } catch (error: any) {
    console.error('Error in getQuestionById:', error?.message);
    return null;
  }
}
