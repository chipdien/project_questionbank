'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/utils/auth-utils';
import { serializeBigInt } from '@/lib/utils/serialization';

export async function classifyQuestions(
  questionIds: number[],
  classification: {
    grade?: string | null;
    lessonId?: string | null;
    difficulty?: string | null;
    topicIds?: number[] | null;
    tagIds?: number[] | null;
  }
) {
  if (!questionIds || questionIds.length === 0) {
    return { success: false, error: 'Chưa chọn câu hỏi nào.' };
  }

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // Check ownership before classifying
    if (levelRank < 5) { // Admin (level >= 5) bypasses this check
      const linkedDocs = await prisma.lms_questions_documents.findMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
        select: { document_id: true, question_id: true },
      });
      const docIds = linkedDocs.map(ld => ld.document_id);

      const docAccess = await prisma.lms_documents.findMany({
        where: {
          id: { in: docIds },
          OR: [
            { created_by_id: userId !== null ? BigInt(userId) : null },
            { teacher_owned: userId !== null ? BigInt(userId) : null },
          ],
        },
        select: { id: true },
      });

      const allowedDocIds = new Set(docAccess.map(d => d.id));
      const accessCheckQuestionIds = linkedDocs
        .filter(ld => allowedDocIds.has(ld.document_id))
        .map(ld => Number(ld.question_id));

      const accessIds = new Set(accessCheckQuestionIds);
      for (const id of questionIds) {
        if (!accessIds.has(id)) {
          return { success: false, error: 'Bạn không có quyền phân loại một số câu hỏi (Vì không phải người tải lên).' };
        }
      }
    }

    const { grade, lessonId, difficulty, topicIds, tagIds } = classification;

    // 1. Cập nhật bảng lms_questions (Khối lớp và Độ khó)
    const updateData: any = {};

    if (grade !== undefined) {
      updateData.grade = grade === '' || grade === null ? null : Number(grade);
    }
    if (difficulty !== undefined) {
      updateData.question_difficulty = difficulty === '' ? null : difficulty;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.lms_questions.updateMany({
        where: { id: { in: questionIds.map(BigInt) } },
        data: updateData,
      });
    }

    // 2. Cập nhật bảng lms_questions_lessons (Chủ đề / Bài học cũ)
    if (lessonId !== undefined) {
      // Xóa các liên kết cũ của các câu hỏi này
      await prisma.lms_questions_lessons.deleteMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
      });

      // Nếu có chọn bài học mới, thực hiện thêm bản ghi
      if (lessonId !== null && lessonId !== '') {
        await prisma.lms_questions_lessons.createMany({
          data: questionIds.map((qId) => ({
            question_id: BigInt(qId),
            lesson_id: BigInt(lessonId),
            created_at: new Date(),
            updated_at: new Date(),
          })),
        });
      }
    }

    // 3. Cập nhật bảng lms_topics_questions (Chủ đề học thuật đệ quy)
    if (topicIds !== undefined) {
      await prisma.lms_topics_questions.deleteMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
      });

      if (topicIds !== null && topicIds.length > 0) {
        const topicQuestionData = [];
        for (const qId of questionIds) {
          for (const tId of topicIds) {
            topicQuestionData.push({
              question_id: BigInt(qId),
              topic_id: BigInt(tId),
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
        }
        await prisma.lms_topics_questions.createMany({
          data: topicQuestionData,
        });
      }
    }

    // 4. Cập nhật bảng lms_questions_tags (Thẻ phân loại bổ trợ)
    if (tagIds !== undefined) {
      await prisma.lms_questions_tags.deleteMany({
        where: { question_id: { in: questionIds.map(BigInt) } },
      });

      if (tagIds !== null && tagIds.length > 0) {
        const tagQuestionData = [];
        for (const qId of questionIds) {
          for (const tId of tagIds) {
            tagQuestionData.push({
              question_id: BigInt(qId),
              tag_id: BigInt(tId),
              created_at: new Date(),
            });
          }
        }
        await prisma.lms_questions_tags.createMany({
          data: tagQuestionData,
        });
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error in classifyQuestions:', error);
    return { success: false, error: error.message };
  }
}

export async function getQuestionsByDocId(
  docId: number,
  page: number = 1,
  pageSize: number = 30,
  excludeIds: number[] = []
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // Check ownership/public access for this specific docId
    const docQueryOr: any[] = [
      { created_by_id: userId !== null ? BigInt(userId) : null },
      { public: '1' },
      { created_by_id: null },
    ];

    const doc = await prisma.lms_documents.findFirst({
      where: levelRank >= 5 ? { id: BigInt(docId) } : {
        id: BigInt(docId),
        OR: docQueryOr,
      },
      select: { id: true },
    });

    if (!doc) {
      return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
    }

    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Number(pageSize));
    const offset = (safePage - 1) * safePageSize;

    // Count total
    const questionsDocs = await prisma.lms_questions_documents.findMany({
      where: {
        document_id: BigInt(docId),
        question_id: excludeIds.length > 0 ? { notIn: excludeIds.map(BigInt) } : undefined,
      },
      select: { question_id: true },
    });

    const questionIds = questionsDocs.map(qd => qd.question_id);
    const total = questionIds.length;

    // Fetch paginated
    const paginatedQuestionIds = questionIds.slice(offset, offset + safePageSize);

    const questionsRaw = await prisma.lms_questions.findMany({
      where: { id: { in: paginatedQuestionIds } },
      orderBy: { id: 'asc' },
    });

    // Fetch lessons linked to these questions
    const questionLessons = await prisma.lms_questions_lessons.findMany({
      where: { question_id: { in: paginatedQuestionIds } },
      select: { question_id: true, lesson_id: true },
    });

    const lessonIds = questionLessons.map(ql => ql.lesson_id);
    const lessonsMap = await prisma.lms_lessons.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, name: true },
    });

    const lessonNameMap = new Map(lessonsMap.map(l => [l.id, l.name]));

    // Fetch options, tags, topics for all questions in one go (batching)
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
        tag_id: Number(r.tag_id),
        tag: {
          id: Number(r.tag.id),
          name: r.tag.name,
          category: r.tag.category,
        },
      });
    }

    // Group topics by question_id
    const topicsMap = new Map<string, any[]>();
    for (const r of allTopicsRelations) {
      const qIdStr = r.question_id.toString();
      if (!topicsMap.has(qIdStr)) topicsMap.set(qIdStr, []);
      topicsMap.get(qIdStr)!.push({
        topic_id: Number(r.topic.id),
        topic: {
          id: Number(r.topic.id),
          title: r.topic.title,
          code: r.topic.code,
        },
      });
    }

    const questions: any[] = [];
    for (const q of questionsRaw) {
      const qIdStr = q.id.toString();
      const linkedLessonIds = questionLessons
        .filter(ql => ql.question_id === q.id)
        .map(ql => ql.lesson_id);
      const names = linkedLessonIds.map(id => lessonNameMap.get(id)).filter(n => n) as string[];

      questions.push({
        ...q,
        lesson_name: names.join(', ') || null,
        options: optionsMap.get(qIdStr) || [],
        tags: tagsMap.get(qIdStr) || [],
        topics: topicsMap.get(qIdStr) || [],
      });
    }

    return serializeBigInt({
      data: questions,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    });
  } catch (error) {
    console.error('Error fetching questions for doc:', error);
    return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
  }
}

export async function getLibraryQuestions(
  page: number = 1,
  pageSize: number = 30,
  filters: {
    grades?: number[];
    difficulties?: string[];
    questionTypes?: string[];
    topicIds?: number[];
    tagIds?: number[];
    complex?: string;
    keyword?: string;
  } = {},
  excludeIds: number[] = []
) {
  const {
    grades = [],
    difficulties = [],
    questionTypes = [],
    topicIds = [],
    tagIds = [],
    keyword = ''
  } = filters;

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Number(pageSize));
    const offset = (safePage - 1) * safePageSize;

    // Base conditions for ownership/visibility
    const docQueryOr: any[] = [
      { created_by_id: userId !== null ? BigInt(userId) : null },
      { public: '1' },
      { created_by_id: null },
    ];

    const docs = await prisma.lms_documents.findMany({
      where: levelRank >= 5 ? {} : { OR: docQueryOr },
      select: { id: true },
    });

    const allowedDocIds = docs.map(d => d.id);

    // Join questions through documents
    const qdRelations = await prisma.lms_questions_documents.findMany({
      where: { document_id: { in: allowedDocIds } },
      select: { question_id: true },
    });

    let targetQuestionIds = Array.from(new Set(qdRelations.map(r => r.question_id)));

    // 1. Lọc theo Topic đệ quy
    if (topicIds && topicIds.length > 0) {
      const selectedTopics = await prisma.lms_topics.findMany({
        where: { id: { in: topicIds.map(BigInt) } },
        select: { path: true }
      });

      const orConditions = selectedTopics
        .filter(t => t.path)
        .map(t => ({ path: { startsWith: t.path! } }));

      if (orConditions.length > 0) {
        const descendantTopics = await prisma.lms_topics.findMany({
          where: { OR: orConditions },
          select: { id: true }
        });
        const descendantIds = descendantTopics.map(t => t.id);

        const topicRelations = await prisma.lms_topics_questions.findMany({
          where: { topic_id: { in: descendantIds } },
          select: { question_id: true }
        });

        const questionIdsFromTopics = topicRelations.map(r => r.question_id);
        targetQuestionIds = targetQuestionIds.filter(id => questionIdsFromTopics.includes(id));
      } else {
        targetQuestionIds = [];
      }
    }

    // 2. Lọc theo Thẻ Tags (OR cùng category, AND giữa các category)
    if (tagIds && tagIds.length > 0) {
      const selectedTags = await prisma.lms_tags.findMany({
        where: { id: { in: tagIds.map(BigInt) } },
        select: { id: true, category: true }
      });

      const tagsByCategory: Record<string, bigint[]> = {};
      for (const t of selectedTags) {
        const cat = t.category.toUpperCase();
        if (!tagsByCategory[cat]) {
          tagsByCategory[cat] = [];
        }
        tagsByCategory[cat].push(t.id);
      }

      let currentFilteredIds = new Set(targetQuestionIds);

      for (const [cat, ids] of Object.entries(tagsByCategory)) {
        const tagRelations = await prisma.lms_questions_tags.findMany({
          where: {
            question_id: { in: Array.from(currentFilteredIds) },
            tag_id: { in: ids }
          },
          select: { question_id: true }
        });
        const matchingIds = new Set(tagRelations.map(r => r.question_id));
        currentFilteredIds = new Set(
          Array.from(currentFilteredIds).filter(id => matchingIds.has(id))
        );
      }

      targetQuestionIds = Array.from(currentFilteredIds);
    }

    const whereClause: any = {
      id: { in: targetQuestionIds },
      AND: []
    };

    // Chỉ hiển thị câu hỏi độc lập hoặc câu hỏi chùm cha (không hiển thị câu hỏi con 'sub' trực tiếp)
    whereClause.AND.push({
      OR: [
        { complex: { not: 'sub' } },
        { complex: null }
      ]
    });

    if (grades && grades.length > 0) {
      whereClause.grade = { in: grades.map(Number) };
    }
    if (difficulties && difficulties.length > 0) {
      whereClause.question_difficulty = { in: difficulties };
    }
    if (questionTypes && questionTypes.length > 0) {
      whereClause.question_type = { in: questionTypes };
    }
    if (excludeIds.length > 0) {
      whereClause.id = {
        in: targetQuestionIds,
        notIn: excludeIds.map(BigInt),
      };
    }
    if (keyword) {
      whereClause.AND.push({
        OR: [
          { statement: { contains: keyword } },
          { content: { contains: keyword } }
        ]
      });
    }

    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    const total = await prisma.lms_questions.count({
      where: whereClause,
    });

    const questionsRaw = await prisma.lms_questions.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      skip: offset,
      take: safePageSize,
    });

    // Lấy thông tin lessons cho các câu hỏi này
    const paginatedQuestionIds = questionsRaw.map(q => q.id);
    const questionLessons = await prisma.lms_questions_lessons.findMany({
      where: { question_id: { in: paginatedQuestionIds } },
      select: { question_id: true, lesson_id: true },
    });

    const lessonIds = questionLessons.map(ql => ql.lesson_id);
    const lessonsMap = await prisma.lms_lessons.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, name: true },
    });

    const lessonNameMap = new Map(lessonsMap.map(l => [l.id, l.name]));

    // Lấy danh sách câu hỏi con (sub_questions) cho các câu hỏi chính (main)
    const mainQuestionIds = questionsRaw.filter(q => q.complex === 'main').map(q => q.id);
    let subQuestionsRaw: any[] = [];
    if (mainQuestionIds.length > 0) {
      subQuestionsRaw = await prisma.lms_questions.findMany({
        where: {
          ref_question_id: { in: mainQuestionIds },
          complex: 'sub'
        },
        orderBy: { id: 'asc' }
      });
    }

    // Kết hợp tất cả câu hỏi cha và con để fetch gộp options và tags
    const allQuestionIds = [
      ...questionsRaw.map(q => q.id),
      ...subQuestionsRaw.map(sub => sub.id)
    ];

    const [allOptions, allTagsRelations] = await Promise.all([
      prisma.lms_options.findMany({
        where: { question_id: { in: allQuestionIds } },
        orderBy: { order: 'asc' },
      }),
      prisma.lms_questions_tags.findMany({
        where: { question_id: { in: allQuestionIds } },
        include: { tag: true }
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
        category: r.tag.category
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
        tags: tagsMap.get(subIdStr) || []
      });
    }

    const questions: any[] = [];
    for (const q of questionsRaw) {
      const qIdStr = q.id.toString();
      const linkedLessonIds = questionLessons
        .filter(ql => ql.question_id === q.id)
        .map(ql => ql.lesson_id);
      const names = linkedLessonIds.map(id => lessonNameMap.get(id)).filter(n => n) as string[];

      const qObj: any = {
        ...q,
        lesson_name: names.join(', ') || null,
        options: optionsMap.get(qIdStr) || [],
        tags: tagsMap.get(qIdStr) || []
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
    });
  } catch (error: any) {
    console.error('Error fetching library questions:', error.message);
    return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
  }
}

export async function getLessons() {
  try {
    const lessons = await prisma.lms_lessons.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, grade: true },
    });
    return lessons.map(l => ({
      id: Number(l.id),
      name: l.name,
      grade: l.grade,
    })) || [];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}

export async function getTagsByCategory() {
  try {
    const tags = await prisma.lms_tags.findMany({
      orderBy: { name: 'asc' },
    });

    const categories = ['SOURCE', 'METHOD', 'SKILL', 'TYPE', 'EXAM', 'YEAR'];
    const grouped: Record<string, any[]> = {};
    for (const cat of categories) {
      grouped[cat] = [];
    }

    for (const tag of tags) {
      const cat = tag.category.toUpperCase();
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push({
        id: Number(tag.id),
        name: tag.name,
        category: tag.category,
      });
    }

    return grouped;
  } catch (error) {
    console.error('Error in getTagsByCategory:', error);
    return {};
  }
}

export async function getTopics() {
  try {
    const topics = await prisma.lms_topics.findMany({
      orderBy: [
        { path: 'asc' },
        { order_index: 'asc' },
      ],
      select: {
        id: true,
        title: true,
        parent_id: true,
        path: true,
      },
    });
    return topics.map(t => ({
      id: Number(t.id),
      title: t.title,
      parent_id: t.parent_id ? Number(t.parent_id) : null,
      path: t.path,
    }));
  } catch (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
}
