'use server'; // Needed because called from Server Components

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/utils/auth.utils';
import { serializeBigInt } from '@/lib/utils/serialization.utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonItem {
  id: number;
  name: string;
  grade?: string | null;
}

export interface TagItem {
  id: number;
  name: string;
  category: string;
}

export interface TopicItem {
  id: number;
  title: string | null;
  parent_id: number | null;
  path: string | null;
}

export interface DocumentItem {
  id: number;
  title: string;
  created_at: string;
  public?: string | null;
  link_s3?: string | null;
  link_s3_answer?: string | null;
  teacher_name?: string | null;
  created_by_id?: number | null;
  teacher_owned?: number | null;
  is_ai_classified?: number | null;
}

export interface QuestionFilters {
  grades?: number[];
  difficulties?: string[];
  questionTypes?: string[];
  topicIds?: number[];
  tagIds?: number[];
  keyword?: string;
  complex?: string;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Fetches all lessons ordered by name.
 */
export async function fetchLessons(): Promise<LessonItem[]> {
  const lessons = await prisma.lms_lessons.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, grade: true },
  });
  return lessons.map((l) => ({
    id: Number(l.id),
    name: l.name ?? '',
    grade: l.grade ? String(l.grade) : null,
  }));
}

/**
 * Fetches all tags grouped by category.
 */
export async function fetchTagsByCategory(): Promise<Record<string, TagItem[]>> {
  const tags = await prisma.lms_tags.findMany({ orderBy: { name: 'asc' } });

  const categories = ['SOURCE', 'METHOD', 'SKILL', 'TYPE', 'EXAM', 'YEAR'];
  const grouped: Record<string, TagItem[]> = {};
  for (const cat of categories) {
    grouped[cat] = [];
  }

  for (const tag of tags) {
    const cat = tag.category.toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({
      id: Number(tag.id),
      name: tag.name,
      category: tag.category,
    });
  }
  return grouped;
}

/**
 * Fetches all topics ordered by path.
 */
export async function fetchTopics(): Promise<TopicItem[]> {
  const topics = await prisma.lms_topics.findMany({
    orderBy: [{ path: 'asc' }, { order_index: 'asc' }],
    select: { id: true, title: true, parent_id: true, path: true },
  });
  return topics.map((t) => ({
    id: Number(t.id),
    title: t.title ?? '',
    parent_id: t.parent_id ? Number(t.parent_id) : null,
    path: t.path ?? '',
  }));
}

/**
 * Fetches documents visible to the current user (or all if admin).
 * Includes teacher name mapping.
 */
export async function fetchAccessibleDocuments(): Promise<DocumentItem[]> {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const levelRank = user?.level_rank ?? 0;
  const isAdmin = levelRank >= 5;

  const docQueryOr: any[] = [
    { created_by_id: userId !== null ? BigInt(userId) : null },
    { public: '1' },
    { created_by_id: null },
  ];

  const docsRaw = await prisma.lms_documents.findMany({
    where: isAdmin ? {} : { OR: docQueryOr },
    orderBy: { created_at: 'desc' },
  });

  const userIds = docsRaw
    .map((d) => d.created_by_id)
    .filter((id): id is bigint => id !== null);

  const copiedFromIds = docsRaw
    .map((d) => d.copied_from_id)
    .filter((id): id is bigint => id !== null);

  const [users, copiedFromDocs] = await Promise.all([
    prisma.lms_users.findMany({
      where: { id: { in: userIds.map((id) => Number(id)) } },
      select: { id: true, username: true, nickname: true },
    }),
    copiedFromIds.length > 0
      ? prisma.lms_documents.findMany({
          where: { id: { in: copiedFromIds } },
          select: { id: true, created_by_id: true },
        })
      : Promise.resolve([]),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u.nickname || u.username]));
  
  // Lấy danh sách user ids của tài liệu gốc
  const originalCreatorIds = copiedFromDocs
    .map((d) => d.created_by_id)
    .filter((id): id is bigint => id !== null);

  const originalCreators = originalCreatorIds.length > 0
    ? await prisma.lms_users.findMany({
        where: { id: { in: originalCreatorIds.map((id) => Number(id)) } },
        select: { id: true, username: true, nickname: true },
      })
    : [];

  const originalCreatorMap = new Map(originalCreators.map((u) => [u.id, u.nickname || u.username]));
  const docOriginalCreatorIdMap = new Map(copiedFromDocs.map((d) => [d.id.toString(), d.created_by_id]));

  return docsRaw.map((d) => {
    let originalOwnerName: string | null = null;
    if (d.copied_from_id) {
      const origCreatorId = docOriginalCreatorIdMap.get(d.copied_from_id.toString());
      if (origCreatorId) {
        originalOwnerName = originalCreatorMap.get(Number(origCreatorId)) || null;
      }
    }

    return {
      id: Number(d.id),
      title: d.title ?? '',
      created_at: d.created_at?.toISOString() ?? '',
      public: d.public,
      link_s3: d.link_s3,
      link_s3_answer: (d as any).link_s3_answer ?? null,
      teacher_name: d.created_by_id ? userMap.get(Number(d.created_by_id)) || null : null,
      created_by_id: d.created_by_id ? Number(d.created_by_id) : null,
      teacher_owned: (d as any).teacher_owned ? Number((d as any).teacher_owned) : null,
      is_ai_classified: (d as any).is_ai_classified ?? null,
      copied_from_id: d.copied_from_id ? Number(d.copied_from_id) : null,
      original_owner_name: originalOwnerName,
    };
  });
}

/**
 * Fetches questions belonging to a specific document with pagination.
 */
export async function fetchQuestionsByDocId(
  docId: number,
  page: number = 1,
  pageSize: number = 30,
  excludeIds: number[] = []
) {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const levelRank = user?.level_rank ?? 0;

  const docQueryOr: any[] = [
    { created_by_id: userId !== null ? BigInt(userId) : null },
    { public: '1' },
    { created_by_id: null },
  ];

  const doc = await prisma.lms_documents.findFirst({
    where:
      levelRank >= 5
        ? { id: BigInt(docId) }
        : { id: BigInt(docId), OR: docQueryOr },
    select: { id: true },
  });

  if (!doc) {
    return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
  }

  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Number(pageSize));
  const offset = (safePage - 1) * safePageSize;

  const questionsDocs = await prisma.lms_questions_documents.findMany({
    where: {
      document_id: BigInt(docId),
      question_id:
        excludeIds.length > 0 ? { notIn: excludeIds.map(BigInt) } : undefined,
    },
    select: { question_id: true },
  });

  const questionIds = questionsDocs.map((qd) => qd.question_id);
  const total = questionIds.length;
  const paginatedQuestionIds = questionIds.slice(offset, offset + safePageSize);

  const questionsRaw = await prisma.lms_questions.findMany({
    where: { id: { in: paginatedQuestionIds } },
    orderBy: { id: 'asc' },
  });

  const questionLessons = await prisma.lms_questions_lessons.findMany({
    where: { question_id: { in: paginatedQuestionIds } },
    select: { question_id: true, lesson_id: true },
  });

  const lessonIds = questionLessons.map((ql) => ql.lesson_id);
  const lessonsData = await prisma.lms_lessons.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, name: true },
  });

  const lessonNameMap = new Map(lessonsData.map((l) => [l.id, l.name]));

  const [allOptions, allTagsRelations, allTopicsRelations] = await Promise.all([
    prisma.lms_options.findMany({
      where: { question_id: { in: paginatedQuestionIds } },
      orderBy: { order: 'asc' },
    }),
    prisma.lms_questions_tags.findMany({
      where: { question_id: { in: paginatedQuestionIds } },
      include: { tag: true },
    }),
    prisma.lms_topics_questions.findMany({
      where: { question_id: { in: paginatedQuestionIds } },
      include: { topic: true },
    }),
  ]);

  const optionsMap = new Map<string, any[]>();
  for (const opt of allOptions) {
    if (!opt.question_id) continue;
    const key = opt.question_id.toString();
    if (!optionsMap.has(key)) optionsMap.set(key, []);
    optionsMap.get(key)!.push(opt);
  }

  const tagsMap = new Map<string, any[]>();
  for (const r of allTagsRelations) {
    const key = r.question_id.toString();
    if (!tagsMap.has(key)) tagsMap.set(key, []);
    tagsMap.get(key)!.push({
      tag_id: Number(r.tag_id),
      tag: { id: Number(r.tag.id), name: r.tag.name, category: r.tag.category },
    });
  }

  const topicsMap = new Map<string, any[]>();
  for (const r of allTopicsRelations) {
    const key = r.question_id.toString();
    if (!topicsMap.has(key)) topicsMap.set(key, []);
    topicsMap.get(key)!.push({
      topic_id: Number(r.topic.id),
      topic: { id: Number(r.topic.id), title: r.topic.title, code: (r.topic as any).code },
    });
  }

  const questions: any[] = [];
  for (const q of questionsRaw) {
    const key = q.id.toString();
    const linkedLessonIds = questionLessons
      .filter((ql) => ql.question_id === q.id)
      .map((ql) => ql.lesson_id);
    const names = linkedLessonIds.map((id) => lessonNameMap.get(id)).filter(Boolean) as string[];
    questions.push({
      ...q,
      lesson_name: names.join(', ') || null,
      options: optionsMap.get(key) || [],
      tags: tagsMap.get(key) || [],
      topics: topicsMap.get(key) || [],
    });
  }

  return serializeBigInt({
    data: questions,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  });
}

/**
 * Fetches library questions with complex filtering and pagination.
 */
export async function fetchLibraryQuestions(
  page: number = 1,
  pageSize: number = 30,
  filters: QuestionFilters = {},
  excludeIds: number[] = []
) {
  const {
    grades = [],
    difficulties = [],
    questionTypes = [],
    topicIds = [],
    tagIds = [],
    keyword = '',
  } = filters;

  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const levelRank = user?.level_rank ?? 0;
  const isAdmin = levelRank >= 5;


  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Number(pageSize));
  const offset = (safePage - 1) * safePageSize;

  const docQueryOr: any[] = [
    { created_by_id: userId !== null ? BigInt(userId) : null },
    { public: '1' },
    { created_by_id: null },
  ];

  let targetQuestionIds: bigint[] | null = null;

  // 1. Phân quyền theo tài liệu (Chỉ áp dụng với Non-Admin)
  if (!isAdmin) {
    const docs = await prisma.lms_documents.findMany({
      where: { OR: docQueryOr },
      select: { id: true },
    });

    const allowedDocIds = docs.map((d) => d.id);

    const qdRelations = await prisma.lms_questions_documents.findMany({
      where: { document_id: { in: allowedDocIds } },
      select: { question_id: true },
    });

    targetQuestionIds = Array.from(new Set(qdRelations.map((r) => r.question_id)));
  }

  // 2. Lọc theo recursive topics
  if (topicIds.length > 0) {
    const selectedTopics = await prisma.lms_topics.findMany({
      where: { id: { in: topicIds.map(BigInt) } },
      select: { path: true },
    });
    const orConditions = selectedTopics
      .filter((t) => t.path)
      .map((t) => ({ path: { startsWith: t.path! } }));

    if (orConditions.length > 0) {
      const descendantTopics = await prisma.lms_topics.findMany({
        where: { OR: orConditions },
        select: { id: true },
      });
      const descendantIds = descendantTopics.map((t) => t.id);
      const topicRelations = await prisma.lms_topics_questions.findMany({
        where: { topic_id: { in: descendantIds } },
        select: { question_id: true },
      });
      const questionIdsFromTopics = topicRelations.map((r) => r.question_id);

      if (targetQuestionIds === null) {
        targetQuestionIds = questionIdsFromTopics;
      } else {
        // Giao nhau bằng Set để tối ưu hiệu năng O(N)
        const topicSet = new Set(questionIdsFromTopics.map((id) => id.toString()));
        targetQuestionIds = targetQuestionIds.filter((id) => topicSet.has(id.toString()));
      }
    } else {
      targetQuestionIds = [];
    }
  }

  // 3. Lọc theo tags (AND giữa các category, OR bên trong category)
  if (tagIds.length > 0) {
    const selectedTags = await prisma.lms_tags.findMany({
      where: { id: { in: tagIds.map(BigInt) } },
      select: { id: true, category: true },
    });

    const tagsByCat: Record<string, bigint[]> = {};
    for (const t of selectedTags) {
      const cat = t.category.toUpperCase();
      if (!tagsByCat[cat]) tagsByCat[cat] = [];
      tagsByCat[cat].push(t.id);
    }

    const categoryResults = await Promise.all(
      Object.values(tagsByCat).map(async (ids) => {
        const tagRelations = await prisma.lms_questions_tags.findMany({
          where: { tag_id: { in: ids } },
          select: { question_id: true },
        });
        return new Set(tagRelations.map((r) => r.question_id.toString()));
      })
    );

    let currentFilteredIds: Set<string> | null = targetQuestionIds
      ? new Set(targetQuestionIds.map((id) => id.toString()))
      : null;

    for (const categorySet of categoryResults) {
      if (currentFilteredIds === null) {
        currentFilteredIds = categorySet;
      } else {
        // Giao nhau bằng Set
        currentFilteredIds = new Set(
          Array.from(currentFilteredIds).filter((idStr) => categorySet.has(idStr))
        );
      }
    }

    if (currentFilteredIds !== null) {
      targetQuestionIds = Array.from(currentFilteredIds).map(BigInt);
    }
  }

  // 4. Xây dựng whereClause cho lms_questions
  const whereClause: any = {
    AND: [{ OR: [{ complex: { not: 'sub' } }, { complex: null }] }],
  };

  // Chỉ thêm điều kiện lọc id nếu targetQuestionIds không phải null
  if (targetQuestionIds !== null) {
    whereClause.id = { in: targetQuestionIds };
  }

  if (grades.length > 0) whereClause.grade = { in: grades.map(Number) };
  if (difficulties.length > 0) whereClause.question_difficulty = { in: difficulties };
  if (questionTypes.length > 0) whereClause.question_type = { in: questionTypes };
  
  if (excludeIds.length > 0) {
    if (whereClause.id) {
      whereClause.id.notIn = excludeIds.map(BigInt);
    } else {
      whereClause.id = { notIn: excludeIds.map(BigInt) };
    }
  }
  
  if (keyword) {
    whereClause.AND.push({
      OR: [{ statement: { contains: keyword } }, { content: { contains: keyword } }],
    });
  }

  if (whereClause.AND.length === 0) delete whereClause.AND;

  const total = await prisma.lms_questions.count({ where: whereClause });
  const questionsRaw = await prisma.lms_questions.findMany({
    where: whereClause,
    orderBy: { id: 'desc' },
    skip: offset,
    take: safePageSize,
  });

  const paginatedQuestionIds = questionsRaw.map((q) => q.id);
  const questionLessons = await prisma.lms_questions_lessons.findMany({
    where: { question_id: { in: paginatedQuestionIds } },
    select: { question_id: true, lesson_id: true },
  });

  const lessonIds = questionLessons.map((ql) => ql.lesson_id);
  const lessonsData = await prisma.lms_lessons.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, name: true },
  });
  const lessonNameMap = new Map(lessonsData.map((l) => [l.id, l.name]));

  const mainQuestionIds = questionsRaw
    .filter((q) => q.complex === 'main')
    .map((q) => q.id);
  let subQuestionsRaw: any[] = [];
  if (mainQuestionIds.length > 0) {
    subQuestionsRaw = await prisma.lms_questions.findMany({
      where: { ref_question_id: { in: mainQuestionIds }, complex: 'sub' },
      orderBy: { id: 'asc' },
    });
  }

  const allQuestionIds = [
    ...questionsRaw.map((q) => q.id),
    ...subQuestionsRaw.map((sub) => sub.id),
  ];

  const [allOptions, allTagsRelations] = await Promise.all([
    prisma.lms_options.findMany({
      where: { question_id: { in: allQuestionIds } },
      orderBy: { order: 'asc' },
    }),
    prisma.lms_questions_tags.findMany({
      where: { question_id: { in: allQuestionIds } },
      include: { tag: true },
    }),
  ]);

  const optionsMap = new Map<string, any[]>();
  for (const opt of allOptions) {
    if (!opt.question_id) continue;
    const key = opt.question_id.toString();
    if (!optionsMap.has(key)) optionsMap.set(key, []);
    optionsMap.get(key)!.push(opt);
  }

  const tagsMap = new Map<string, any[]>();
  for (const r of allTagsRelations) {
    const key = r.question_id.toString();
    if (!tagsMap.has(key)) tagsMap.set(key, []);
    tagsMap.get(key)!.push({ id: Number(r.tag.id), name: r.tag.name, category: r.tag.category });
  }

  const subQuestionsMap = new Map<string, any[]>();
  for (const sub of subQuestionsRaw) {
    if (!sub.ref_question_id) continue;
    const refKey = sub.ref_question_id.toString();
    if (!subQuestionsMap.has(refKey)) subQuestionsMap.set(refKey, []);
    subQuestionsMap.get(refKey)!.push({
      ...sub,
      options: optionsMap.get(sub.id.toString()) || [],
      tags: tagsMap.get(sub.id.toString()) || [],
    });
  }

  const questions: any[] = [];
  for (const q of questionsRaw) {
    const key = q.id.toString();
    const linkedLessonIds = questionLessons
      .filter((ql) => ql.question_id === q.id)
      .map((ql) => ql.lesson_id);
    const names = linkedLessonIds
      .map((id) => lessonNameMap.get(id))
      .filter(Boolean) as string[];

    const qObj: any = {
      ...q,
      lesson_name: names.join(', ') || null,
      options: optionsMap.get(key) || [],
      tags: tagsMap.get(key) || [],
    };
    if (q.complex === 'main') {
      qObj.sub_questions = subQuestionsMap.get(key) || [];
    }
    questions.push(qObj);
  }

  return serializeBigInt({
    data: questions,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  });
}
