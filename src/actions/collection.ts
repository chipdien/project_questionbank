'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId, getCurrentUser } from '@/lib/utils/auth-utils';
import { serializeBigInt } from '@/lib/utils/serialization';

export const createCollectionAction = createCollection;

export async function createCollection(title: string, questionIds: number[]) {
  if (!title || title.trim() === '') {
    return { success: false, error: 'Tiêu đề bộ sưu tập không được để trống.' };
  }

  if (!questionIds || questionIds.length === 0) {
    return { success: false, error: 'Chưa chọn câu hỏi nào để lưu.' };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Bạn cần đăng nhập để thực hiện chức năng này.' };
    }

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
        data: questionIds.map(qId => ({
          collection_id: collection.id,
          question_id: BigInt(qId),
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });

      return Number(collection.id);
    });

    revalidatePath('/collection');

    return { success: true, collectionId };
  } catch (error: any) {
    console.error('Error saving collection:', error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi lưu bộ sưu tập.' };
  }
}

export const getCollectionsAction = getCollections;

export async function getCollections() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    if (!userId) return [];

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
        collection_id: { in: collections.map(c => c.id) },
      },
    });

    const countMap = new Map(counts.map(item => [item.collection_id, item._count.question_id]));

    return serializeBigInt(collections.map(c => ({
      ...c,
      question_count: countMap.get(c.id) || 0,
    })));
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

/**
 * Lấy danh sách bộ sưu tập DO CHÍNH user hiện tại tạo (kể cả admin),
 * dùng cho chức năng "thêm câu hỏi vào bộ sưu tập có sẵn".
 */
export async function getMyCollections() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const collections = await prisma.lms_collections.findMany({
      where: { created_by_id: BigInt(userId) },
      orderBy: { updated_at: 'desc' },
    });

    const counts = await prisma.lms_questions_collections.groupBy({
      by: ['collection_id'],
      _count: { question_id: true },
      where: { collection_id: { in: collections.map(c => c.id) } },
    });
    const countMap = new Map(counts.map(item => [item.collection_id, item._count.question_id]));

    return serializeBigInt(collections.map(c => ({
      ...c,
      question_count: countMap.get(c.id) || 0,
    })));
  } catch (error) {
    console.error('Error fetching my collections:', error);
    return [];
  }
}

/**
 * Thêm các câu hỏi vào một bộ sưu tập có sẵn (bỏ qua câu đã tồn tại).
 * Chỉ chủ sở hữu (hoặc admin) mới được thêm.
 */
export async function addQuestionsToCollection(collectionId: number, questionIds: number[]) {
  if (!questionIds || questionIds.length === 0) {
    return { success: false, error: 'Chưa chọn câu hỏi nào để thêm.' };
  }

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;
    if (!userId) {
      return { success: false, error: 'Bạn cần đăng nhập để thực hiện chức năng này.' };
    }

    const collection = await prisma.lms_collections.findFirst({
      where: levelRank >= 5
        ? { id: BigInt(collectionId) }
        : { id: BigInt(collectionId), created_by_id: BigInt(userId) },
    });
    if (!collection) {
      return { success: false, error: 'Không tìm thấy bộ sưu tập hoặc bạn không có quyền.' };
    }

    const qBigIds = questionIds.map(q => BigInt(q));
    const existing = await prisma.lms_questions_collections.findMany({
      where: { collection_id: BigInt(collectionId), question_id: { in: qBigIds } },
      select: { question_id: true },
    });
    const existingSet = new Set(existing.map(e => e.question_id.toString()));
    const toAdd = qBigIds.filter(q => !existingSet.has(q.toString()));

    if (toAdd.length > 0) {
      await prisma.lms_questions_collections.createMany({
        data: toAdd.map(qId => ({
          collection_id: BigInt(collectionId),
          question_id: qId,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });
      await prisma.lms_collections.update({
        where: { id: BigInt(collectionId) },
        data: { updated_at: new Date(), updated_by_id: BigInt(userId) },
      });
    }

    revalidatePath('/collection');
    return { success: true, added: toAdd.length, skipped: questionIds.length - toAdd.length };
  } catch (error: any) {
    console.error('Error adding questions to collection:', error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi thêm vào bộ sưu tập.' };
  }
}

export const getCollectionByIdAction = getCollectionById;

export async function getCollectionById(id: number) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    if (!userId) return null;

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
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export const getCollectionQuestionsAction = getCollectionQuestions;

export async function getCollectionQuestions(collectionId: number, page = 1, pageSize = 30) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    if (!userId) return { data: [], totalPages: 0, totalCount: 0, page: 1 };

    // Kiểm tra quyền sở hữu bộ sưu tập
    const collectionAccess = await prisma.lms_collections.findFirst({
      where: levelRank >= 5 ? { id: BigInt(collectionId) } : {
        id: BigInt(collectionId),
        created_by_id: BigInt(userId),
      },
      select: { id: true },
    });

    if (!collectionAccess) {
      return { data: [], totalPages: 0, totalCount: 0, page: 1 };
    }

    const offset = (page - 1) * pageSize;

    // 1. Lấy tổng số câu hỏi để tính totalPages
    const totalCount = await prisma.lms_questions_collections.count({
      where: { collection_id: BigInt(collectionId) },
    });
    const totalPages = Math.ceil(totalCount / pageSize);

    // 2. Lấy dữ liệu câu hỏi có phân trang
    const qcRelations = await prisma.lms_questions_collections.findMany({
      where: { collection_id: BigInt(collectionId) },
      orderBy: { created_at: 'asc' },
      skip: offset,
      take: pageSize,
      select: { question_id: true },
    });

    const questionIds = qcRelations.map(r => r.question_id);

    const questionsRaw = await prisma.lms_questions.findMany({
      where: { id: { in: questionIds } },
    });

    // Sắp xếp câu hỏi theo đúng thứ tự liên kết
    const questionsOrdered = questionIds
      .map(id => questionsRaw.find(q => q.id === id))
      .filter((q): q is any => q !== undefined);

    // Lấy tên bài học
    const questionLessons = await prisma.lms_questions_lessons.findMany({
      where: { question_id: { in: questionIds } },
      select: { question_id: true, lesson_id: true },
    });

    const lessonIds = questionLessons.map(ql => ql.lesson_id);
    const lessons = await prisma.lms_lessons.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, name: true },
    });

    const lessonNameMap = new Map(lessons.map(l => [l.id, l.name]));

    const questionsWithLessons = questionsOrdered.map((q) => {
      const linkedLessonId = questionLessons.find(ql => ql.question_id === q.id)?.lesson_id;
      const lessonName = linkedLessonId ? lessonNameMap.get(linkedLessonId) || null : null;

      return {
        ...q,
        lesson_name: lessonName,
      };
    });

    // Lấy options, tags, topics cho từng câu hỏi
    for (const q of questionsWithLessons) {
      const options = await prisma.lms_options.findMany({
        where: { question_id: q.id },
        orderBy: { order: 'asc' },
      });
      q.options = options;

      // Lấy tags liên kết
      const qTagsRelations = await prisma.lms_questions_tags.findMany({
        where: { question_id: q.id },
        include: { tag: true }
      });
      q.tags = qTagsRelations.map(r => ({
        id: Number(r.tag.id),
        name: r.tag.name,
        category: r.tag.category
      }));

      // Lấy topics liên kết
      const qTopicsRelations = await prisma.lms_topics_questions.findMany({
        where: { question_id: q.id },
        include: { topic: true }
      });
      q.topics = qTopicsRelations.map(r => ({
        topic_id: Number(r.topic.id),
        topic: {
          id: Number(r.topic.id),
          title: r.topic.title,
          code: r.topic.code,
        }
      }));
    }

    return serializeBigInt({
      data: questionsWithLessons,
      totalPages,
      totalCount,
      page,
    });
  } catch (error) {
    console.error('Error fetching collection questions:', error);
    return {
      data: [],
      totalPages: 0,
      totalCount: 0,
      page: 1,
    };
  }
}
