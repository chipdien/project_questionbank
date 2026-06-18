import { prisma } from '@/lib/db';
import { serializeBigInt } from '@/lib/utils/serialization.utils';

export class CollectionService {
  /**
   * Tạo bộ sưu tập mới và liên kết các câu hỏi.
   */
  static async createCollection(title: string, questionIds: number[], userId: number): Promise<number> {
    const collectionId = await prisma.$transaction(async (tx) => {
      // 1. Tạo bộ sưu tập mới
      const collection = await tx.lms_collections.create({
        data: {
          title,
          created_at: new Date(),
          updated_at: new Date(),
          created_by_id: BigInt(userId),
          updated_by_id: BigInt(userId),
        },
      });

      // 2. Chèn các câu hỏi vào bảng trung gian
      await tx.lms_questions_collections.createMany({
        data: questionIds.map((qId) => ({
          collection_id: collection.id,
          question_id: BigInt(qId),
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });

      return Number(collection.id);
    });

    return collectionId;
  }

  /**
   * Lấy danh sách bộ sưu tập dựa trên quyền hạn (level rank).
   */
  static async getCollections(userId: number, levelRank: number): Promise<any[]> {
    const collections = await prisma.lms_collections.findMany({
      where: levelRank >= 5 ? {} : {
        created_by_id: BigInt(userId),
      },
      orderBy: { created_at: 'desc' },
    });

    const counts = await prisma.lms_questions_collections.groupBy({
      by: ['collection_id'],
      _count: {
        question_id: true,
      },
      where: {
        collection_id: { in: collections.map((c) => c.id) },
      },
    });

    const countMap = new Map(counts.map((item) => [item.collection_id.toString(), item._count.question_id]));

    const result = collections.map((c) => ({
      ...c,
      question_count: countMap.get(c.id.toString()) || 0,
    }));

    return serializeBigInt(result);
  }

  /**
   * Lấy danh sách bộ sưu tập do chính user tạo.
   */
  static async getMyCollections(userId: number): Promise<any[]> {
    const collections = await prisma.lms_collections.findMany({
      where: { created_by_id: BigInt(userId) },
      orderBy: { updated_at: 'desc' },
    });

    const counts = await prisma.lms_questions_collections.groupBy({
      by: ['collection_id'],
      _count: { question_id: true },
      where: { collection_id: { in: collections.map((c) => c.id) } },
    });

    const countMap = new Map(counts.map((item) => [item.collection_id.toString(), item._count.question_id]));

    const result = collections.map((c) => ({
      ...c,
      question_count: countMap.get(c.id.toString()) || 0,
    }));

    return serializeBigInt(result);
  }

  /**
   * Thêm các câu hỏi vào một bộ sưu tập có sẵn.
   */
  static async addQuestionsToCollection(
    collectionId: number,
    questionIds: number[],
    userId: number,
    levelRank: number
  ): Promise<{ added: number; skipped: number }> {
    const collection = await prisma.lms_collections.findFirst({
      where: levelRank >= 5
        ? { id: BigInt(collectionId) }
        : { id: BigInt(collectionId), created_by_id: BigInt(userId) },
    });

    if (!collection) {
      throw new Error('Không tìm thấy bộ sưu tập hoặc bạn không có quyền.');
    }

    const qBigIds = questionIds.map((q) => BigInt(q));
    const existing = await prisma.lms_questions_collections.findMany({
      where: { collection_id: BigInt(collectionId), question_id: { in: qBigIds } },
      select: { question_id: true },
    });

    const existingSet = new Set(existing.map((e) => e.question_id.toString()));
    const toAdd = qBigIds.filter((q) => !existingSet.has(q.toString()));

    if (toAdd.length > 0) {
      await prisma.lms_questions_collections.createMany({
        data: toAdd.map((qId) => ({
          collection_id: BigInt(collectionId),
          question_id: qId,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });

      await prisma.lms_collections.update({
        where: { id: BigInt(collectionId) },
        data: {
          updated_at: new Date(),
          updated_by_id: BigInt(userId),
        },
      });
    }

    return {
      added: toAdd.length,
      skipped: questionIds.length - toAdd.length,
    };
  }

  /**
   * Lấy chi tiết bộ sưu tập.
   */
  static async getCollectionById(id: number, userId: number, levelRank: number): Promise<any | null> {
    const collection = await prisma.lms_collections.findFirst({
      where: levelRank >= 5 ? { id: BigInt(id) } : {
        id: BigInt(id),
        created_by_id: BigInt(userId),
      },
    });

    if (!collection) return null;

    const count = await prisma.lms_questions_collections.count({
      where: { collection_id: BigInt(id) },
    });

    return serializeBigInt({
      ...collection,
      question_count: count,
    });
  }

  /**
   * Lấy danh sách câu hỏi trong bộ sưu tập (có phân trang).
   */
  static async getCollectionQuestions(
    collectionId: number,
    page: number,
    pageSize: number,
    userId: number,
    levelRank: number
  ): Promise<{ data: any[]; totalCount: number }> {
    // Kiểm tra quyền sở hữu bộ sưu tập
    const collectionAccess = await prisma.lms_collections.findFirst({
      where: levelRank >= 5 ? { id: BigInt(collectionId) } : {
        id: BigInt(collectionId),
        created_by_id: BigInt(userId),
      },
      select: { id: true },
    });

    if (!collectionAccess) {
      return { data: [], totalCount: 0 };
    }

    const offset = (page - 1) * pageSize;

    // 1. Lấy tổng số câu hỏi
    const totalCount = await prisma.lms_questions_collections.count({
      where: { collection_id: BigInt(collectionId) },
    });

    if (totalCount === 0) {
      return { data: [], totalCount: 0 };
    }

    // 2. Lấy dữ liệu câu hỏi có phân trang
    const qcRelations = await prisma.lms_questions_collections.findMany({
      where: { collection_id: BigInt(collectionId) },
      orderBy: { created_at: 'asc' },
      skip: offset,
      take: pageSize,
      select: { question_id: true },
    });

    const questionIds = qcRelations.map((r) => r.question_id);

    const questionsRaw = await prisma.lms_questions.findMany({
      where: { id: { in: questionIds } },
    });

    // Sắp xếp câu hỏi theo đúng thứ tự liên kết
    const questionsOrdered = questionIds
      .map((id) => questionsRaw.find((q) => q.id === id))
      .filter((q): q is any => q !== undefined);

    // Lấy tên bài học
    const questionLessons = await prisma.lms_questions_lessons.findMany({
      where: { question_id: { in: questionIds } },
      select: { question_id: true, lesson_id: true },
    });

    const lessonIds = questionLessons.map((ql) => ql.lesson_id);
    const lessons = await prisma.lms_lessons.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, name: true },
    });

    const lessonNameMap = new Map(lessons.map((l) => [l.id.toString(), l.name]));

    const questionsWithLessons = questionsOrdered.map((q) => {
      const linkedLessonId = questionLessons.find((ql) => ql.question_id === q.id)?.lesson_id;
      const lessonName = linkedLessonId ? lessonNameMap.get(linkedLessonId.toString()) || null : null;

      return {
        ...q,
        lesson_name: lessonName,
      };
    });

    // Lấy options, tags, topics cho tất cả câu hỏi trong một lượt (batching)
    const [allOptions, allTagsRelations, allTopicsRelations] = await Promise.all([
      prisma.lms_options.findMany({
        where: { question_id: { in: questionIds } },
        orderBy: { order: 'asc' },
      }),
      prisma.lms_questions_tags.findMany({
        where: { question_id: { in: questionIds } },
        include: { tag: true },
      }),
      prisma.lms_topics_questions.findMany({
        where: { question_id: { in: questionIds } },
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
        topic_id: Number(r.topic.id),
        topic: {
          id: Number(r.topic.id),
          title: r.topic.title,
          code: r.topic.code,
        },
      });
    }

    // Gán dữ liệu cho từng câu hỏi
    for (const q of questionsWithLessons) {
      const qIdStr = q.id.toString();
      q.options = optionsMap.get(qIdStr) || [];
      q.tags = tagsMap.get(qIdStr) || [];
      q.topics = topicsMap.get(qIdStr) || [];
    }

    return serializeBigInt({
      data: questionsWithLessons,
      totalCount,
    });
  }
}
