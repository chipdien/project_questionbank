'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/utils/auth-utils';

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
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // Check ownership before classifying
    if (levelRank < 5) { // Admin (level >= 5) bypasses this check
      const placeholders = questionIds.map(() => '?').join(',');
      const accessCheck = await query<{ id: number }[]>(`
        SELECT q.id
        FROM lms_questions q
        JOIN lms_questions_documents qd ON q.id = qd.question_id
        JOIN lms_documents d ON qd.document_id = d.id
        WHERE q.id IN (${placeholders})
        AND (d.created_by_id = ? OR d.teacher_owned = ?)
      `, [...questionIds, userId, userId]);

      const accessIds = new Set(accessCheck.map(r => r.id));
      for (const id of questionIds) {
        if (!accessIds.has(id)) {
          return { success: false, error: 'Bạn không có quyền phân loại một số câu hỏi (Vì không phải người tải lên).' };
        }
      }
    }

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
    const docAccess = await query<any[]>(
      `SELECT id FROM lms_documents 
       WHERE id = ? AND (created_by_id = ? OR \`public\` = '1' OR created_by_id IS NULL OR ? >= 5)`,
      [docId, userId, levelRank]
    );

    if (docAccess.length === 0) {
      return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
    }

    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Number(pageSize));
    const offset = (safePage - 1) * safePageSize;

    // Count total
    let countSql = `
      SELECT COUNT(DISTINCT q.id) as total
      FROM lms_questions q
      JOIN lms_questions_documents qd ON q.id = qd.question_id
      WHERE qd.document_id = ?
    `;
    const countParams: any[] = [docId];
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      countSql += ` AND q.id NOT IN (${placeholders})`;
      countParams.push(...excludeIds);
    }
    const countResult = await query<any[]>(countSql, countParams);
    const total = Number(countResult[0]?.total || 0);

    // Fetch paginated
    let paginatedSql = `
      SELECT q.*, GROUP_CONCAT(l.name SEPARATOR ', ') as lesson_name
      FROM lms_questions q
      LEFT JOIN lms_questions_lessons ql ON q.id = ql.question_id
      LEFT JOIN lms_lessons l ON ql.lesson_id = l.id
      JOIN lms_questions_documents qd ON q.id = qd.question_id
      WHERE qd.document_id = ?
    `;
    const queryParams: any[] = [docId];
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      paginatedSql += ` AND q.id NOT IN (${placeholders})`;
      queryParams.push(...excludeIds);
    }
    paginatedSql += ` GROUP BY q.id ORDER BY q.id ASC LIMIT ? OFFSET ?`;
    queryParams.push(safePageSize, offset);

    const questions = await query<any[]>(paginatedSql, queryParams);

    for (const q of questions) {
      const options = await query<any[]>(
        'SELECT * FROM lms_options WHERE question_id = ? ORDER BY `order` ASC',
        [q.id]
      );
      q.options = options;
    }

    return {
      data: questions,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize)
    };
  } catch (error) {
    console.error('Error fetching questions for doc:', error);
    return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
  }
}

export async function getLibraryQuestions(
  page: number = 1,
  pageSize: number = 30,
  filters: { grade?: string; difficulty?: string; lessonId?: string } = {},
  excludeIds: number[] = []
) {
  const { grade = '', difficulty = '', lessonId = '' } = filters;

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Number(pageSize));
    const offset = (safePage - 1) * safePageSize;

    // Base conditions for ownership/visibility
    const authWhere = `(d.created_by_id = ? OR d.public = '1' OR d.created_by_id IS NULL OR ? >= 5)`;
    const authParams = [userId, levelRank];

    // Count total
    let countSql = `
      SELECT COUNT(DISTINCT q.id) as total 
      FROM lms_questions q
      LEFT JOIN lms_questions_lessons ql ON q.id = ql.question_id
      JOIN lms_questions_documents qd ON q.id = qd.question_id
      JOIN lms_documents d ON qd.document_id = d.id
      WHERE ${authWhere}
    `;
    const countParams: any[] = [...authParams];

    if (grade) {
      countSql += ' AND q.grade = ?';
      countParams.push(grade);
    }
    if (difficulty) {
      countSql += ' AND q.question_difficulty = ?';
      countParams.push(difficulty);
    }
    if (lessonId) {
      countSql += ' AND ql.lesson_id = ?';
      countParams.push(lessonId);
    }
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      countSql += ` AND q.id NOT IN (${placeholders})`;
      countParams.push(...excludeIds);
    }

    const countResult = await query<any[]>(countSql, countParams);
    const total = Number(countResult[0]?.total || 0);
    
    // Fetch pagination
    let paginatedSql = `
      SELECT q.*, GROUP_CONCAT(DISTINCT l.name SEPARATOR ', ') as lesson_name
      FROM lms_questions q
      LEFT JOIN lms_questions_lessons ql ON q.id = ql.question_id
      LEFT JOIN lms_lessons l ON ql.lesson_id = l.id
      JOIN lms_questions_documents qd ON q.id = qd.question_id
      JOIN lms_documents d ON qd.document_id = d.id
      WHERE ${authWhere}
    `;
    const queryParams: any[] = [...authParams];

    if (grade) {
      paginatedSql += ` AND q.grade = ?`;
      queryParams.push(grade);
    }
    if (difficulty) {
      paginatedSql += ` AND q.question_difficulty = ?`;
      queryParams.push(difficulty);
    }
    if (lessonId) {
      paginatedSql += ` AND ql.lesson_id = ?`;
      queryParams.push(lessonId);
    }
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      paginatedSql += ` AND q.id NOT IN (${placeholders})`;
      queryParams.push(...excludeIds);
    }

    paginatedSql += ` GROUP BY q.id ORDER BY q.id DESC LIMIT ? OFFSET ?`;
    queryParams.push(Number(safePageSize), Number(offset));

    const questions = await query<any[]>(paginatedSql, queryParams);

    for (const q of questions) {
      const options = await query<any[]>(
        'SELECT * FROM lms_options WHERE question_id = ? ORDER BY `order` ASC',
        [q.id]
      );
      q.options = options;
    }

    return {
      data: questions,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize)
    };
  } catch (error: any) {
    console.error('Error fetching library questions:', error.message);
    return { data: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
  }
}

export async function getLessons() {
  try {
    const lessons = await query<any[]>('SELECT id, name, grade FROM lms_lessons ORDER BY name ASC');
    return lessons || [];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}

