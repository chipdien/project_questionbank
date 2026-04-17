'use server';

import { query } from '@/lib/db';
import { QuestionClassifierService } from '@/lib/services/ai';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/utils/auth-utils';

export async function autoClassifyWithAI(documentId: number) {
  if (!documentId) {
    return { success: false, error: 'Thiếu Document ID.' };
  }

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // 1. Kiểm tra xem tài liệu đã được phân loại chưa + Quyền truy cập
    const docResult = await query<{ is_ai_classified: number; teacher_owned: number | null; created_by_id: number | null }[]>(
      `SELECT is_ai_classified, teacher_owned, created_by_id FROM lms_documents WHERE id = ?`,
      [documentId]
    );

    if (docResult.length === 0) {
      return { success: false, error: 'Không tìm thấy tài liệu.' };
    }

    const doc = docResult[0];
    const isOwner = doc.created_by_id === userId || doc.teacher_owned === userId;

    if (!isOwner && levelRank < 5) { // Chỉ owner hoặc admin mới được phân loại
      return { success: false, error: 'Bạn không có quyền phân loại câu hỏi của tài liệu này.' };
    }

    if (docResult.length > 0 && docResult[0].is_ai_classified === 1) {
      return { success: false, error: 'Tài liệu này đã được phân loại bằng AI rồi.' };
    }

    // 2. Lấy danh sách câu hỏi thuộc tài liệu
    const questions = await query<{ id: number; statement: string }[]>(
      `SELECT q.id, q.statement 
       FROM lms_questions q
       JOIN lms_questions_documents qd ON q.id = qd.question_id
       WHERE qd.document_id = ?`,
      [documentId]
    );

    if (questions.length === 0) {
      return { success: false, error: 'Tài liệu không có câu hỏi nào để phân loại.' };
    }

    // 3. Lấy danh sách bài học hiện có
    const lessons = await query<{ id: number; name: string }[]>(
      'SELECT id, name FROM lms_lessons ORDER BY name ASC'
    );

    // 4. Gọi AI Classification Service
    const classifications = await QuestionClassifierService.classify(questions, lessons);

    // 5. Cập nhật kết quả vào database
    for (const item of classifications) {
      const { question_id, grade, difficulty, lesson_id } = item;
      
      await query(
        'UPDATE lms_questions SET grade = ?, question_difficulty = ? WHERE id = ?',
        [grade, difficulty, question_id]
      );

      if (lesson_id) {
        await query('DELETE FROM lms_questions_lessons WHERE question_id = ?', [question_id]);
        await query(
          'INSERT INTO lms_questions_lessons (created_at, updated_at, question_id, lesson_id) VALUES (NOW(), NOW(), ?, ?)',
          [question_id, lesson_id]
        );
      }
    }

    // 6. Đánh dấu tài liệu đã phân loại xong
    await query(
      'UPDATE lms_documents SET is_ai_classified = 1 WHERE id = ?',
      [documentId]
    );

    revalidatePath('/');
    return { success: true, count: classifications.length };
  } catch (error: any) {
    console.error('Error in autoClassifyWithAI:', error);
    return { success: false, error: error.message };
  }
}
