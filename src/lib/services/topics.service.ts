import { prisma } from '@/lib/db';
import { serializeBigInt } from '@/lib/utils/serialization.utils';
import { generatePath, updateDescendantsPaths } from '@/lib/utils/materialized-path.utils';

export interface CreateTopicInput {
  title: string;
  type?: string;
  content?: string;
  code?: string;
  parent_id?: number | null;
  subject_id?: number | null;
  syllabus_id?: number | null;
  order_index?: number | null;
}

export interface UpdateTopicInput {
  title?: string;
  type?: string;
  content?: string;
  code?: string;
  parent_id?: number | null;
  subject_id?: number | null;
  syllabus_id?: number | null;
  order_index?: number | null;
}

export class TopicsService {
  /**
   * Lấy toàn bộ danh sách chủ đề hoặc lọc theo rootPath.
   */
  static async getTopics(rootPath?: string): Promise<any[]> {
    let topics;
    if (rootPath) {
      topics = await prisma.lms_topics.findMany({
        where: {
          path: {
            startsWith: rootPath,
          },
        },
        include: {
          _count: {
            select: { questions: true },
          },
        },
        orderBy: [
          { path: 'asc' },
          { order_index: 'asc' },
        ],
      });
    } else {
      topics = await prisma.lms_topics.findMany({
        include: {
          _count: {
            select: { questions: true },
          },
        },
        orderBy: [
          { path: 'asc' },
          { order_index: 'asc' },
        ],
      });
    }

    return serializeBigInt(topics);
  }

  /**
   * Tạo mới một node chủ đề.
   */
  static async createTopic(input: CreateTopicInput): Promise<any> {
    const { title, type, content, code, parent_id, subject_id, syllabus_id, order_index } = input;

    const parentIdParsed = parent_id ? BigInt(parent_id) : null;
    const subjectIdParsed = subject_id ? BigInt(subject_id) : null;
    const syllabusIdParsed = syllabus_id ? BigInt(syllabus_id) : null;
    const orderIndexParsed = order_index !== null && order_index !== undefined ? BigInt(order_index) : null;

    // 1. Tạo node mới (chưa có path)
    const newTopic = await prisma.lms_topics.create({
      data: {
        title,
        parent_id: parentIdParsed,
        type,
        content,
        subject_id: subjectIdParsed,
        syllabus_id: syllabusIdParsed,
        code,
        order_index: orderIndexParsed,
      },
    });

    // 2. Tính toán path dựa trên id
    const computedPath = await generatePath(parentIdParsed, newTopic.id);

    // 3. Cập nhật lại path cho node đó
    const updatedTopic = await prisma.lms_topics.update({
      where: { id: newTopic.id },
      data: { path: computedPath },
    });

    return serializeBigInt(updatedTopic);
  }

  /**
   * Cập nhật thông tin chủ đề (hỗ trợ di chuyển node cha).
   */
  static async updateTopic(id: number, input: UpdateTopicInput): Promise<any> {
    const topicId = BigInt(id);
    const { title, type, content, code, parent_id, subject_id, syllabus_id, order_index } = input;

    // Lấy thông tin node hiện tại
    const currentTopic = await prisma.lms_topics.findUnique({
      where: { id: topicId },
    });

    if (!currentTopic) {
      throw new Error('Không tìm thấy chủ đề học thuật.');
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (code !== undefined) updateData.code = code;
    if (subject_id !== undefined) updateData.subject_id = subject_id ? BigInt(subject_id) : null;
    if (syllabus_id !== undefined) updateData.syllabus_id = syllabus_id ? BigInt(syllabus_id) : null;
    if (order_index !== undefined) updateData.order_index = order_index !== null && order_index !== undefined ? BigInt(order_index) : null;

    // Xử lý di chuyển node cha (parent_id thay đổi)
    if (parent_id !== undefined) {
      const newParentId = parent_id ? BigInt(parent_id) : null;
      if (newParentId !== currentTopic.parent_id) {
        // Tránh vòng lặp
        if (newParentId === topicId) {
          throw new Error('Không thể đặt một chủ đề làm cha của chính nó.');
        }
        if (newParentId && currentTopic.path) {
          const newParent = await prisma.lms_topics.findUnique({
            where: { id: newParentId },
          });
          if (newParent && newParent.path?.startsWith(currentTopic.path)) {
            throw new Error('Không thể đặt chủ đề con làm cha mới.');
          }
        }

        updateData.parent_id = newParentId;
        const newPath = await generatePath(newParentId, topicId);
        updateData.path = newPath;

        // Tiến hành cập nhật node hiện tại và con cháu
        const oldPath = currentTopic.path || '';
        const updated = await prisma.lms_topics.update({
          where: { id: topicId },
          data: updateData,
        });

        await updateDescendantsPaths(topicId, oldPath, newPath);
        return serializeBigInt(updated);
      }
    }

    // Nếu không thay đổi parent_id
    const updated = await prisma.lms_topics.update({
      where: { id: topicId },
      data: updateData,
    });

    return serializeBigInt(updated);
  }

  /**
   * Xóa một chủ đề.
   */
  static async deleteTopic(id: number): Promise<any> {
    const topicId = BigInt(id);

    const currentTopic = await prisma.lms_topics.findUnique({
      where: { id: topicId },
    });

    if (!currentTopic) {
      throw new Error('Không tìm thấy chủ đề.');
    }

    const subtopicsCount = await prisma.lms_topics.count({
      where: { parent_id: topicId },
    });

    const questionsCount = await prisma.lms_topics_questions.count({
      where: { topic_id: topicId },
    });

    if (subtopicsCount > 0 || questionsCount > 0) {
      const err: any = new Error('Không thể xóa chủ đề. Nó chứa các chủ đề con hoặc có câu hỏi liên kết.');
      err.code = 'RESTRICT_DELETE';
      err.details = { subtopics_count: subtopicsCount, questions_count: questionsCount };
      throw err;
    }

    const deleted = await prisma.lms_topics.delete({
      where: { id: topicId },
    });

    return serializeBigInt(deleted);
  }

  /**
   * Lấy toàn bộ các chủ đề con/cháu và câu hỏi liên quan.
   */
  static async fetchRelated(id: number): Promise<any> {
    const topicId = BigInt(id);

    const currentTopic = await prisma.lms_topics.findUnique({
      where: { id: topicId },
    });

    if (!currentTopic) {
      throw new Error('Không tìm thấy chủ đề.');
    }

    // Lấy toàn bộ các chủ đề con/cháu (dùng materialized path)
    const descendants = await prisma.lms_topics.findMany({
      where: {
        path: {
          startsWith: currentTopic.path || '',
        },
        id: {
          not: topicId,
        },
      },
    });

    // Gom danh sách tất cả ID chủ đề bao gồm cả chính nó và con cháu
    const topicIds = [topicId, ...descendants.map((d) => d.id)];

    // Lấy các câu hỏi liên kết trực tiếp và gián tiếp
    const topicQuestions = await prisma.lms_topics_questions.findMany({
      where: {
        topic_id: {
          in: topicIds,
        },
      },
      include: {
        question: {
          select: {
            id: true,
            code: true,
            statement: true,
          },
        },
      },
    });

    // Trích xuất danh sách câu hỏi độc bản
    const seenIds = new Set<string>();
    const questions: any[] = [];
    for (const tq of topicQuestions) {
      if (tq.question) {
        const qIdStr = tq.question.id.toString();
        if (!seenIds.has(qIdStr)) {
          seenIds.add(qIdStr);
          questions.push(tq.question);
        }
      }
    }

    return serializeBigInt({
      topic_id: topicId,
      title: currentTopic.title,
      subtopics_count: descendants.length,
      subtopics: descendants,
      questions_count: questions.length,
      questions: questions,
    });
  }

  /**
   * Di chuyển câu hỏi sang chủ đề khác.
   */
  static async transferQuestions(id: number, targetTopicId: number, includeSubtopics: boolean): Promise<any> {
    const topicId = BigInt(id);
    const targetTopicBigId = BigInt(targetTopicId);

    const currentTopic = await prisma.lms_topics.findUnique({
      where: { id: topicId },
    });

    const targetTopic = await prisma.lms_topics.findUnique({
      where: { id: targetTopicBigId },
    });

    if (!currentTopic || !targetTopic) {
      throw new Error('Không tìm thấy chủ đề nguồn hoặc chủ đề đích.');
    }

    let topicIds = [topicId];
    if (includeSubtopics) {
      const descendants = await prisma.lms_topics.findMany({
        where: {
          path: {
            startsWith: currentTopic.path || '',
          },
        },
        select: { id: true },
      });
      topicIds = descendants.map((d) => d.id);
    }

    // Tìm toàn bộ câu hỏi liên kết với các topics này
    const topicQuestions = await prisma.lms_topics_questions.findMany({
      where: {
        topic_id: { in: topicIds },
      },
    });

    const questionIds = Array.from(new Set(topicQuestions.map((tq) => tq.question_id)));

    if (questionIds.length === 0) {
      return {
        message: 'Không có câu hỏi nào để chuyển đi.',
        transferred_questions_count: 0,
        affected_question_ids: [],
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Xóa toàn bộ liên kết hiện tại
      await tx.lms_topics_questions.deleteMany({
        where: {
          question_id: { in: questionIds },
          topic_id: { in: topicIds },
        },
      });

      // 2. Tìm xem các câu hỏi này đã liên kết với target topic chưa
      const existingRelations = await tx.lms_topics_questions.findMany({
        where: {
          question_id: { in: questionIds },
          topic_id: targetTopicBigId,
        },
      });
      const existingQIds = new Set(existingRelations.map((r) => r.question_id.toString()));

      // 3. Tạo liên kết mới
      const relationsToCreate = questionIds
        .filter((qId) => !existingQIds.has(qId.toString()))
        .map((qId) => ({
          question_id: qId,
          topic_id: targetTopicBigId,
          created_at: new Date(),
          updated_at: new Date(),
        }));

      if (relationsToCreate.length > 0) {
        await tx.lms_topics_questions.createMany({
          data: relationsToCreate,
        });
      }
    });

    return serializeBigInt({
      message: `Đã di chuyển thành công ${questionIds.length} câu hỏi sang chủ đề mới.`,
      transferred_questions_count: questionIds.length,
      affected_question_ids: questionIds.map((id) => id.toString()),
    });
  }

  /**
   * Di chuyển nhiều chủ đề.
   */
  static async bulkMoveTopics(topicIds: number[], targetParentId: number | null): Promise<any> {
    const targetParentBigId = targetParentId ? BigInt(targetParentId) : null;
    const topicBigIds = topicIds.map((id) => BigInt(id));

    // Lấy thông tin của các node di chuyển
    const topicsToMove = await prisma.lms_topics.findMany({
      where: { id: { in: topicBigIds } },
    });

    if (topicsToMove.length !== topicBigIds.length) {
      throw new Error('Một số chủ đề nguồn không tìm thấy.');
    }

    if (targetParentBigId) {
      const targetParent = await prisma.lms_topics.findUnique({
        where: { id: targetParentBigId },
      });

      if (!targetParent) {
        throw new Error('Chủ đề cha đích không tồn tại.');
      }

      // Kiểm tra vòng lặp
      for (const topic of topicsToMove) {
        if (targetParentBigId === topic.id) {
          throw new Error(`Không thể di chuyển chủ đề vào chính nó: "${topic.title}"`);
        }
        if (topic.path && targetParent.path?.startsWith(topic.path)) {
          throw new Error(`Không thể di chuyển chủ đề vào chủ đề con của nó: "${topic.title}"`);
        }
      }
    }

    const results: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const topic of topicsToMove) {
        const currentTopic = await tx.lms_topics.findUnique({
          where: { id: topic.id },
          select: { path: true },
        });
        const oldPath = currentTopic?.path || '';
        const newPath = await generatePath(targetParentBigId, topic.id, tx);

        const updated = await tx.lms_topics.update({
          where: { id: topic.id },
          data: {
            parent_id: targetParentBigId,
            path: newPath,
          },
        });

        await updateDescendantsPaths(topic.id, oldPath, newPath, tx);
        results.push(updated);
      }
    }, {
      timeout: 10000,
    });

    return serializeBigInt({
      message: `Di chuyển thành công ${results.length} chủ đề.`,
      moved_topics: results,
    });
  }

  /**
   * Xóa hàng loạt chủ đề.
   */
  static async bulkDeleteTopics(topicIds: number[]): Promise<any> {
    const topicBigIds = topicIds.map((id) => BigInt(id));

    const questionsCount = await prisma.lms_topics_questions.count({
      where: { topic_id: { in: topicBigIds } },
    });

    const externalSubtopicsCount = await prisma.lms_topics.count({
      where: {
        parent_id: { in: topicBigIds },
        id: { notIn: topicBigIds },
      },
    });

    if (questionsCount > 0 || externalSubtopicsCount > 0) {
      const err: any = new Error(
        'Không thể xóa hàng loạt. Các chủ đề được chọn vẫn còn câu hỏi liên kết hoặc chứa chủ đề con khác không được chọn để xóa cùng.'
      );
      err.code = 'RESTRICT_DELETE';
      err.details = { questions_count: questionsCount, subtopics_count: externalSubtopicsCount };
      throw err;
    }

    const deletedCount = await prisma.$transaction(async (tx) => {
      // Set null parent_id cho các node con cùng nằm trong danh sách xóa để tránh lỗi khóa ngoại self-relation
      await tx.lms_topics.updateMany({
        where: {
          id: { in: topicBigIds },
          parent_id: { in: topicBigIds },
        },
        data: {
          parent_id: null,
        },
      });

      const { count } = await tx.lms_topics.deleteMany({
        where: { id: { in: topicBigIds } },
      });
      return count;
    });

    return serializeBigInt({
      message: `Đã xóa thành công ${deletedCount} chủ đề.`,
      count: deletedCount,
    });
  }

  /**
   * Lấy danh sách câu hỏi của một topic (kèm options)
   */
  static async fetchTopicQuestions(topicId: number): Promise<any[]> {
    const topicBigId = BigInt(topicId);

    const topicQuestions = await prisma.lms_topics_questions.findMany({
      where: { topic_id: topicBigId },
      select: { question_id: true },
    });

    const questionIds = topicQuestions.map((tq) => tq.question_id);

    if (questionIds.length === 0) return [];

    const questions = await prisma.lms_questions.findMany({
      where: { id: { in: questionIds } },
      orderBy: { id: 'desc' },
    });

    // Gộp options của tất cả câu hỏi vào 1 truy vấn rồi nhóm theo question_id
    // (tránh N+1: trước đây mỗi câu hỏi chạy 1 truy vấn options riêng).
    const allOptions = await prisma.lms_options.findMany({
      where: { question_id: { in: questionIds } },
      orderBy: { order: 'asc' },
    });
    const optionsByQuestion = new Map<string, any[]>();
    for (const opt of allOptions) {
      if (!opt.question_id) continue;
      const key = opt.question_id.toString();
      (optionsByQuestion.get(key) ?? optionsByQuestion.set(key, []).get(key)!).push(opt);
    }

    const questionsWithOptions = questions.map((q) => ({
      ...q,
      options: optionsByQuestion.get(q.id.toString()) ?? [],
    }));

    return serializeBigInt(questionsWithOptions);
  }

  /**
   * Di chuyển hàng loạt câu hỏi giữa các chủ đề
   */
  static async bulkMoveQuestions(
    questionIds: number[],
    sourceTopicId: number,
    targetTopicId: number
  ): Promise<number> {
    const questionBigIds = questionIds.map((id) => BigInt(id));
    const sourceTopicBigId = BigInt(sourceTopicId);
    const targetTopicBigId = BigInt(targetTopicId);

    const movedCount = await prisma.$transaction(async (tx) => {
      // 1. Xóa liên kết cũ
      await tx.lms_topics_questions.deleteMany({
        where: {
          question_id: { in: questionBigIds },
          topic_id: sourceTopicBigId,
        },
      });

      // 2. Tạo liên kết mới
      let count = 0;
      for (const qId of questionBigIds) {
        const existing = await tx.lms_topics_questions.findUnique({
          where: {
            topic_id_question_id: {
              topic_id: targetTopicBigId,
              question_id: qId,
            },
          },
        });

        if (!existing) {
          await tx.lms_topics_questions.create({
            data: {
              topic_id: targetTopicBigId,
              question_id: qId,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          count++;
        }
      }
      return count;
    });

    return movedCount;
  }
}
