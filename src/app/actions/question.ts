'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function classifyQuestions(
  questionIds: number[],
  classification: {
    grade?: string | null;
    lessonId?: string | null;
    difficulty?: string | null;
  }
) {
  if (!questionIds || questionIds.length === 0) {
    return { success: false, error: 'Chưa chọn câu hỏi nào.' };
  }

  try {
    const { grade, lessonId, difficulty } = classification;

    // 1. Cập nhật bảng lms_questions (Khối lớp và Độ khó)
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (grade !== undefined) {
      updateFields.push('grade = ?');
      updateValues.push(grade === '' ? null : grade);
    }
    if (difficulty !== undefined) {
      updateFields.push('question_difficulty = ?');
      updateValues.push(difficulty === '' ? null : difficulty);
    }

    if (updateFields.length > 0) {
      const placeholders = questionIds.map(() => '?').join(',');
      const sql = `UPDATE lms_questions SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`;
      await query(sql, [...updateValues, ...questionIds]);
    }

    // 2. Cập nhật bảng lms_questions_lessons (Chủ đề)
    if (lessonId !== undefined) {
      // Xóa các liên kết cũ của các câu hỏi này
      const placeholders = questionIds.map(() => '?').join(',');
      await query(`DELETE FROM lms_questions_lessons WHERE question_id IN (${placeholders})`, [...questionIds]);

      // Nếu có chọn bài học mới, thực hiện thêm bản ghi theo kiểu Bulk Insert
      if (lessonId !== null && lessonId !== '') {
        const insertValues: any[] = [];
        const rows = questionIds.map((qId) => {
          insertValues.push(qId, lessonId);
          return '(NOW(), NOW(), ?, ?)';
        }).join(', ');

        const sqlInsert = `INSERT INTO lms_questions_lessons (created_at, updated_at, question_id, lesson_id) VALUES ${rows}`;
        await query(sqlInsert, insertValues);
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error in classifyQuestions:', error);
    return { success: false, error: error.message };
  }
}

export async function getQuestionsByDocId(docId: number) {
  try {
    const questions = await query<any[]>(
      `SELECT q.*, l.name as lesson_name
       FROM lms_questions q
       LEFT JOIN lms_questions_lessons ql ON q.id = ql.question_id
       LEFT JOIN lms_lessons l ON ql.lesson_id = l.id
       JOIN lms_questions_documents qd ON q.id = qd.question_id
       WHERE qd.document_id = ?
       ORDER BY q.id ASC`,
      [docId]
    );

    // Lấy options cho từng câu hỏi
    for (const q of questions) {
      const options = await query<any[]>(
        'SELECT * FROM lms_options WHERE question_id = ? ORDER BY `order` ASC',
        [q.id]
      );
      q.options = options;
    }

    return questions;
  } catch (error) {
    console.error('Error fetching questions for doc:', error);
    return [];
  }
}
