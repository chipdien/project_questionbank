import { prisma } from '../db';
import { QuestionParserService } from './ai';

export class IngestService {
  /**
   * Khởi tạo task xử lý mới.
   */
  static async createTask(fileName: string, fileHash: string) {
    const task = await prisma.lms_processing_tasks.create({
      data: {
        file_hash: fileHash,
        file_name: fileName,
        status: 'PENDING',
      },
    });
    return task.id;
  }

  static async checkDuplicatesByHash(fileHash: string): Promise<any[]> {
    const tasks = await prisma.lms_processing_tasks.findMany({
      where: {
        file_hash: fileHash,
        status: 'COMPLETED',
        document_id: { not: null },
      },
    });

    if (tasks.length === 0) return [];

    const docIds = tasks.map(t => BigInt(t.document_id!));

    const documents = await prisma.lms_documents.findMany({
      where: {
        id: { in: docIds },
      },
    });

    const userIds = documents
      .map(d => d.created_by_id)
      .filter((id): id is bigint => id !== null);

    const users = await prisma.lms_users.findMany({
      where: {
        id: { in: userIds.map(id => Number(id)) },
      },
    });

    const userMap = new Map(users.map(u => [u.id, u.username]));

    const results = [];
    for (const t of tasks) {
      const doc = documents.find(d => d.id === BigInt(t.document_id!));
      if (!doc) continue;

      results.push({
        document_id: t.document_id,
        content: doc.content,
        link_s3: doc.link_s3,
        public: doc.public,
        created_by_id: doc.created_by_id,
        uploader_name: doc.created_by_id ? userMap.get(Number(doc.created_by_id)) || null : null,
      });
    }

    return results;
  }

  /**
   * Cập nhật trạng thái của task.
   */
  static async updateTaskStatus(taskId: number, status: string, rawText?: string, documentId?: number) {
    const data: any = { status };

    if (rawText !== undefined) {
      data.raw_text = rawText;
    }
    if (documentId !== undefined) {
      data.document_id = documentId;
    }

    await prisma.lms_processing_tasks.update({
      where: { id: taskId },
      data,
    });
  }

  /**
   * Phân tích văn bản thô bằng Gemini.
   */
  static async processAi(rawText: string, rawAnswerText?: string) {
    return await QuestionParserService.parseQuestions(rawText, rawAnswerText);
  }

  /**
   * Lưu dữ liệu đã có cấu trúc vào CSDL.
   */
  static async saveToDatabase(
    taskId: number,
    fileName: string,
    rawText: string,
    structuredData: any,
    isPublic: boolean = false,
    linkS3: string | null = null,
    userId: number | null = null,
    linkS3Answer: string | null = null
  ) {
    try {
      const publicVal = isPublic ? '1' : '0';
      const userIdBigInt = userId !== null ? BigInt(userId) : null;

      const result = await prisma.$transaction(async (tx) => {
        // 1. Insert into lms_documents
        const doc = await tx.lms_documents.create({
          data: {
            title: fileName,
            content: rawText,
            public: publicVal,
            link_s3: linkS3,
            link_s3_answer: linkS3Answer,
            created_at: new Date(),
            updated_at: new Date(),
            created_by_id: userIdBigInt,
            updated_by_id: userIdBigInt,
            teacher_owned: userIdBigInt,
          },
        });
        const documentId = Number(doc.id);

        const questions = structuredData.questions || [];

        for (const q of questions) {
          // 2. Insert into lms_questions
          const question = await tx.lms_questions.create({
            data: {
              content: q.statement,
              statement: q.statement,
              hint: q.hint || null,
              question_type: q.question_type || 'SINGLE_CHOICE',
              created_at: new Date(),
              updated_at: new Date(),
              created_by_id: userIdBigInt,
              updated_by_id: userIdBigInt,
              teacher_owned_by_id: userIdBigInt,
              owned_by_id: null,
            },
          });
          const questionId = question.id;

          // 3. Link question to document
          await tx.lms_questions_documents.create({
            data: {
              document_id: doc.id,
              question_id: questionId,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });

          // 4. Insert options if any
          if (q.options && Array.isArray(q.options)) {
            for (const opt of q.options) {
              await tx.lms_options.create({
                data: {
                  question_id: questionId,
                  content: opt.content,
                  order: opt.order !== undefined ? BigInt(opt.order) : null,
                  weight: opt.weight !== undefined ? Number(opt.weight) : 0,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              });
            }
          }
        }

        return { documentId, questionsCount: questions.length };
      });

      // Update task
      await this.updateTaskStatus(taskId, 'COMPLETED', undefined, result.documentId);

      return { success: true, documentId: result.documentId, questionsCount: result.questionsCount };
    } catch (error: any) {
      await this.updateTaskStatus(taskId, 'FAILED');
      console.error('Save to Database error:', error);
      throw new Error(`Lỗi khi lưu vào CSDL: ${error.message}`);
    }
  }

  static async reuseDocument(taskId: number, fileName: string, existingData: any, isPublic: boolean, userId: number | null) {
    try {
      console.log(`[ReuseDocument] Start cloning document ID: ${existingData.document_id} for User ID: ${userId}`);
      const publicVal = isPublic ? '1' : '0';
      const userIdBigInt = userId !== null ? BigInt(userId) : null;

      const result = await prisma.$transaction(async (tx) => {
        // 1. Insert bản ghi document mới cho user hiện tại
        console.log(`[ReuseDocument] Inserting new document record`);
        const doc = await tx.lms_documents.create({
          data: {
            title: fileName,
            content: existingData.content,
            public: publicVal,
            link_s3: existingData.link_s3,
            created_at: new Date(),
            updated_at: new Date(),
            created_by_id: userIdBigInt,
            updated_by_id: userIdBigInt,
            teacher_owned: userIdBigInt,
          },
        });
        const newDocumentId = Number(doc.id);

        // 2. Lấy các câu hỏi từ document cũ và link sang document mới
        console.log(`[ReuseDocument] Fetching linked questions`);
        const questions = await tx.lms_questions_documents.findMany({
          where: {
            document_id: BigInt(existingData.document_id),
          },
          select: {
            question_id: true,
          },
        });

        if (questions.length > 0) {
          console.log(`[ReuseDocument] Linking ${questions.length} questions to new document`);
          await tx.lms_questions_documents.createMany({
            data: questions.map(q => ({
              document_id: doc.id,
              question_id: q.question_id,
              created_at: new Date(),
              updated_at: new Date(),
            })),
          });
        }

        return { newDocumentId, questionsCount: questions.length };
      });

      console.log(`[ReuseDocument] Updating task status`);
      await this.updateTaskStatus(taskId, 'COMPLETED', undefined, result.newDocumentId);

      console.log(`[ReuseDocument] Finished`);
      return { success: true, documentId: result.newDocumentId, questionsCount: result.questionsCount };
    } catch (error: any) {
      console.error('[ReuseDocument] Reuse Document error:', error);
      throw new Error(`Lỗi khi tái sử dụng tài liệu: ${error.message}`);
    }
  }
}
