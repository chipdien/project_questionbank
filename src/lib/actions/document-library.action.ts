'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/utils/auth.utils';
import { serializeBigInt } from '@/lib/utils/serialization.utils';

/**
 * Cập nhật chế độ chia sẻ (Public / Private) của tài liệu
 */
export async function updateDocumentVisibility(docId: number, isPublic: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Bạn cần đăng nhập để thực hiện tác vụ này.' };
    }

    const userId = user.id;
    const levelRank = user.level_rank || 0;

    // Check ownership
    const doc = await prisma.lms_documents.findFirst({
      where: { id: BigInt(docId) },
    });

    if (!doc) {
      return { success: false, error: 'Không tìm thấy tài liệu.' };
    }

    if (levelRank < 5 && doc.created_by_id !== BigInt(userId) && doc.teacher_owned !== BigInt(userId)) {
      return { success: false, error: 'Bạn không có quyền chỉnh sửa tài liệu này.' };
    }

    await prisma.lms_documents.update({
      where: { id: BigInt(docId) },
      data: {
        public: isPublic ? '1' : '0',
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating document visibility:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Lấy danh sách tài liệu mới tải lên gần đây của giáo viên
 */
export async function getRecentDocuments(limit: number = 8) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const userId = user.id;
    const levelRank = user.level_rank || 0;

    // Admin có thể xem tất cả, giáo viên chỉ xem tài liệu của mình
    const whereClause = levelRank >= 5 ? {} : {
      OR: [
        { created_by_id: BigInt(userId) },
        { teacher_owned: BigInt(userId) }
      ]
    };

    const docs = await prisma.lms_documents.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return serializeBigInt(docs);
  } catch (error) {
    console.error('Error in getRecentDocuments:', error);
    return [];
  }
}

/**
 * Lấy chi tiết tài liệu theo ID (bao gồm check quyền sở hữu)
 */
export async function getDocumentById(docId: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Bạn cần đăng nhập để xem tài liệu này.' };
    }

    const userId = user.id;
    const levelRank = user.level_rank || 0;

    const doc = await prisma.lms_documents.findFirst({
      where: { id: BigInt(docId) },
    });

    if (!doc) {
      return { success: false, error: 'Không tìm thấy tài liệu.' };
    }

    // Check quyền: admin, public doc, hoặc uploader
    const isUploader = doc.created_by_id === BigInt(userId) || doc.teacher_owned === BigInt(userId);
    const isPublic = doc.public === '1';

    if (levelRank < 5 && !isUploader && !isPublic) {
      return { success: false, error: 'Bạn không có quyền xem tài liệu này.' };
    }

    return { success: true, data: serializeBigInt(doc) };
  } catch (error: any) {
    console.error('Error in getDocumentById:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Tạo bản sao (Deep Copy) của tài liệu và toàn bộ câu hỏi/tùy chọn liên quan
 */
export async function duplicateDocumentAction(docId: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Bạn cần đăng nhập để thực hiện tác vụ này.' };
    }

    const userId = user.id;

    // 1. Kiểm tra xem đã có bản sao từ trước hay chưa
    const existingDuplicate = await prisma.lms_documents.findFirst({
      where: {
        copied_from_id: BigInt(docId),
        created_by_id: BigInt(userId),
      },
    });

    if (existingDuplicate) {
      return {
        success: true,
        alreadyExists: true,
        docId: Number(existingDuplicate.id),
      };
    }

    // 2. Lấy thông tin document gốc
    const originalDoc = await prisma.lms_documents.findFirst({
      where: { id: BigInt(docId) },
    });

    if (!originalDoc) {
      return { success: false, error: 'Không tìm thấy tài liệu gốc.' };
    }

    // 3. Thực hiện nhân bản sâu trong transaction
    const newDoc = await prisma.$transaction(async (tx) => {
      // Tạo document mới
      const createdDoc = await tx.lms_documents.create({
        data: {
          title: `Bản sao - ${originalDoc.title || 'Không tên'}`,
          content: originalDoc.content,
          link_s3: originalDoc.link_s3,
          link_s3_answer: originalDoc.link_s3_answer,
          copied_from_id: BigInt(docId),
          created_by_id: BigInt(userId),
          teacher_owned: BigInt(userId),
          public: '0', // Mặc định bản sao là private
          is_ai_classified: originalDoc.is_ai_classified,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Lấy tất cả quan hệ câu hỏi cũ
      const oldQuestionsRelations = await tx.lms_questions_documents.findMany({
        where: { document_id: BigInt(docId) },
      });

      const oldQuestionIds = oldQuestionsRelations.map((r) => r.question_id);

      if (oldQuestionIds.length > 0) {
        // Lấy thông tin chi tiết của tất cả câu hỏi cũ (cả main và sub)
        const oldQuestions = await tx.lms_questions.findMany({
          where: { id: { in: oldQuestionIds } },
        });

        // Tìm các câu hỏi phụ (sub) liên quan trực tiếp đến các câu hỏi main trên
        const mainQuestionIds = oldQuestions.filter(q => q.complex === 'main').map(q => q.id);
        let subQuestions: any[] = [];
        if (mainQuestionIds.length > 0) {
          subQuestions = await tx.lms_questions.findMany({
            where: { ref_question_id: { in: mainQuestionIds }, complex: 'sub' },
          });
        }

        // Gom tất cả các câu hỏi cần nhân bản
        const questionsToDuplicate = [...oldQuestions, ...subQuestions];
        const duplicatedQuestionsMap = new Map<string, bigint>(); // map: oldQuestionIdStr -> newQuestionId

        // Tách câu hỏi cha (main/normal) và con (sub) để insert tuần tự và giữ ref_question_id
        const mainToCopy = questionsToDuplicate.filter(q => q.complex !== 'sub');
        const subToCopy = questionsToDuplicate.filter(q => q.complex === 'sub');

        // Copy câu hỏi cha trước
        for (const q of mainToCopy) {
          const newQ = await tx.lms_questions.create({
            data: {
              statement: q.statement,
              content: q.content,
              complex: q.complex,
              question_type: q.question_type,
              question_level: q.question_level,
              ref_question_id: null,
              public: '0',
              hint: q.hint,
              domain_id: q.domain_id,
              grade: q.grade,
              active: q.active,
              process: q.process,
              status: q.status,
              question_difficulty: q.question_difficulty,
              code: q.code,
              created_by_id: BigInt(userId),
              teacher_owned_by_id: BigInt(userId),
              owned_by_id: BigInt(userId),
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          duplicatedQuestionsMap.set(q.id.toString(), newQ.id);

          // Copy options tương ứng
          const oldOptions = await tx.lms_options.findMany({
            where: { question_id: q.id },
          });
          if (oldOptions.length > 0) {
            await tx.lms_options.createMany({
              data: oldOptions.map((opt) => ({
                content: opt.content,
                weight: opt.weight,
                order: opt.order,
                set: opt.set,
                question_id: newQ.id,
                created_by_id: BigInt(userId),
                created_at: new Date(),
                updated_at: new Date(),
              })),
            });
          }

          // Sao chép các quan hệ (tags, topics, lessons)
          const oldTags = await tx.lms_questions_tags.findMany({ where: { question_id: q.id } });
          if (oldTags.length > 0) {
            await tx.lms_questions_tags.createMany({
              data: oldTags.map(t => ({
                question_id: newQ.id,
                tag_id: t.tag_id,
                created_at: new Date(),
              })),
            });
          }

          const oldTopics = await tx.lms_topics_questions.findMany({ where: { question_id: q.id } });
          if (oldTopics.length > 0) {
            await tx.lms_topics_questions.createMany({
              data: oldTopics.map(tp => ({
                question_id: newQ.id,
                topic_id: tp.topic_id,
                created_at: new Date(),
                updated_at: new Date(),
              })),
            });
          }

          const oldLessons = await tx.lms_questions_lessons.findMany({ where: { question_id: q.id } });
          if (oldLessons.length > 0) {
            await tx.lms_questions_lessons.createMany({
              data: oldLessons.map(l => ({
                question_id: newQ.id,
                lesson_id: l.lesson_id,
                created_at: new Date(),
                updated_at: new Date(),
              })),
            });
          }
        }

        // Copy câu hỏi con (sub) và map ref_question_id đúng
        for (const q of subToCopy) {
          const newRefId = q.ref_question_id ? duplicatedQuestionsMap.get(q.ref_question_id.toString()) : null;
          if (!newRefId) continue; // Bỏ qua nếu không tìm thấy cha mới

          const newQ = await tx.lms_questions.create({
            data: {
              statement: q.statement,
              content: q.content,
              complex: q.complex,
              question_type: q.question_type,
              question_level: q.question_level,
              ref_question_id: newRefId,
              public: '0',
              hint: q.hint,
              domain_id: q.domain_id,
              grade: q.grade,
              active: q.active,
              process: q.process,
              status: q.status,
              question_difficulty: q.question_difficulty,
              code: q.code,
              created_by_id: BigInt(userId),
              teacher_owned_by_id: BigInt(userId),
              owned_by_id: BigInt(userId),
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          duplicatedQuestionsMap.set(q.id.toString(), newQ.id);

          // Copy options cho sub question
          const oldOptions = await tx.lms_options.findMany({
            where: { question_id: q.id },
          });
          if (oldOptions.length > 0) {
            await tx.lms_options.createMany({
              data: oldOptions.map((opt) => ({
                content: opt.content,
                weight: opt.weight,
                order: opt.order,
                set: opt.set,
                question_id: newQ.id,
                created_by_id: BigInt(userId),
                created_at: new Date(),
                updated_at: new Date(),
              })),
            });
          }
        }

        // Tạo liên kết giữa các câu hỏi cha mới nhân bản vào document mới
        const newDocQuestionRelations = oldQuestions.map(oq => {
          const newQId = duplicatedQuestionsMap.get(oq.id.toString());
          return {
            document_id: createdDoc.id,
            question_id: newQId!,
            created_at: new Date(),
            updated_at: new Date(),
          };
        }).filter(r => r.question_id !== undefined);

        if (newDocQuestionRelations.length > 0) {
          await tx.lms_questions_documents.createMany({
            data: newDocQuestionRelations,
          });
        }
      }

      return createdDoc;
    });

    return {
      success: true,
      alreadyExists: false,
      docId: Number(newDoc.id),
    };
  } catch (error: any) {
    console.error('Lỗi khi tạo bản sao tài liệu:', error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi tạo bản sao.' };
  }
}

