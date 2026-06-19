import { prisma } from '@/lib/db';

export interface CreateQuestionInput {
  statement: string;
  content?: string;
  question_type: string;
  question_difficulty: string;
  grade: string;
  hint?: string;
  options?: { content: string; order: number; weight: number }[];
  topicIds?: number[];
  tagIds?: number[];
  userId?: number | null;
  collectionId?: number;
  newCollectionTitle?: string;
}

export class QuestionManualService {
  /**
   * Lưu câu hỏi được tạo thủ công vào cơ sở dữ liệu.
   */
  static async createQuestion(input: CreateQuestionInput) {
    const {
      statement,
      content,
      question_type,
      question_difficulty,
      grade,
      hint,
      options = [],
      topicIds = [],
      tagIds = [],
      userId,
      collectionId,
      newCollectionTitle
    } = input;

    const userIdBigInt = userId ? BigInt(userId) : null;
    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // 1. Tạo bản ghi lms_questions
      const question = await tx.lms_questions.create({
        data: {
          statement,
          content: content || statement,
          question_type,
          question_difficulty,
          grade: grade ? Number(grade) : 0,
          hint: hint || null,
          created_at: now,
          updated_at: now,
          created_by_id: userIdBigInt,
          updated_by_id: userIdBigInt,
          teacher_owned_by_id: userIdBigInt,
          owned_by_id: userIdBigInt,
          complex: 'single',
          active: '1',
          process: '0',
          status: 'APPROVED',
        },
      });

      const questionId = question.id;

      // 2. Tạo options nếu có
      if (options && options.length > 0) {
        await tx.lms_options.createMany({
          data: options.map((opt) => ({
            question_id: questionId,
            content: opt.content,
            order: BigInt(opt.order),
            weight: Number(opt.weight),
            created_at: now,
            updated_at: now,
            created_by_id: userIdBigInt,
            updated_by_id: userIdBigInt,
          })),
        });
      }

      // 3. Tạo lms_topics_questions
      if (topicIds && topicIds.length > 0) {
        await tx.lms_topics_questions.createMany({
          data: topicIds.map((topicId) => ({
            question_id: questionId,
            topic_id: BigInt(topicId),
            created_at: now,
            updated_at: now,
          })),
        });
      }

      // 4. Tạo lms_questions_tags
      if (tagIds && tagIds.length > 0) {
        await tx.lms_questions_tags.createMany({
          data: tagIds.map((tagId) => ({
            question_id: questionId,
            tag_id: BigInt(tagId),
            created_at: now,
          })),
        });
      }

      let createdCollectionId: number | undefined;
      let createdCollectionTitle: string | undefined;

      // 5. Liên kết vào collection nếu có
      if (collectionId) {
        await tx.lms_questions_collections.create({
          data: {
            collection_id: BigInt(collectionId),
            question_id: questionId,
            created_at: now,
            updated_at: now,
          },
        });
        createdCollectionId = collectionId;
      } else if (newCollectionTitle && newCollectionTitle.trim() !== '') {
        const newCollection = await tx.lms_collections.create({
          data: {
            title: newCollectionTitle.trim(),
            created_by_id: userIdBigInt,
            updated_by_id: userIdBigInt,
            created_at: now,
            updated_at: now,
          },
        });
        await tx.lms_questions_collections.create({
          data: {
            collection_id: newCollection.id,
            question_id: questionId,
            created_at: now,
            updated_at: now,
          },
        });
        createdCollectionId = Number(newCollection.id);
        createdCollectionTitle = newCollection.title ?? undefined;
      }

      return {
        ...question,
        createdCollectionId,
        createdCollectionTitle,
      };
    });
  }
}
