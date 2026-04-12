'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const createCollectionAction = createCollection;

export async function createCollection(title: string, questionIds: number[]) {
  if (!title || title.trim() === '') {
    return { success: false, error: 'Tiêu đề bộ sưu tập không được để trống.' };
  }

  if (!questionIds || questionIds.length === 0) {
    return { success: false, error: 'Chưa chọn câu hỏi nào để lưu.' };
  }

  try {
    const now = new Date();
    
    // 1. Tạo bộ sưu tập mới
    const result = await query(
      'INSERT INTO lms_collections (title, created_at, updated_at) VALUES (?, ?, ?)',
      [title, now, now]
    ) as any;

    const collectionId = result.insertId;

    if (!collectionId) {
      throw new Error('Không thể tạo bộ sưu tập.');
    }

    // 2. Chèn các câu hỏi vào bảng trung gian
    // Bulk insert: INSERT INTO lms_questions_collections (collection_id, question_id, created_at, updated_at) VALUES (?, ?, ?, ?), (?, ?, ?, ?)
    const placeholders = questionIds.map(() => '(?, ?, ?, ?)').join(', ');
    const values = questionIds.flatMap(qId => [collectionId, qId, now, now]);

    await query(
      `INSERT INTO lms_questions_collections (collection_id, question_id, created_at, updated_at) VALUES ${placeholders}`,
      values
    );

    revalidatePath('/collections'); // Giả sử sẽ có trang danh sách collections

    return { success: true, collectionId };
  } catch (error: any) {
    console.error('Error saving collection:', error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi lưu bộ sưu tập.' };
  }
}

export const getCollectionsAction = getCollections;

export async function getCollections() {
  try {
    const rows = await query(`
      SELECT 
        c.*, 
        COUNT(qc.question_id) as question_count 
      FROM lms_collections c 
      LEFT JOIN lms_questions_collections qc ON c.id = qc.collection_id 
      GROUP BY c.id 
      ORDER BY c.created_at DESC
    `) as any[];

    return rows;
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

export const getCollectionByIdAction = getCollectionById;

export async function getCollectionById(id: number) {
  try {
    const rows = await query(`
      SELECT 
        c.*, 
        COUNT(qc.question_id) as question_count 
      FROM lms_collections c 
      LEFT JOIN lms_questions_collections qc ON c.id = qc.collection_id 
      WHERE c.id = ?
      GROUP BY c.id 
    `, [id]) as any[];

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export const getCollectionQuestionsAction = getCollectionQuestions;

export async function getCollectionQuestions(collectionId: number, page = 1, pageSize = 30) {
  try {
    const offset = (page - 1) * pageSize;

    // 1. Lấy tổng số câu hỏi để tính totalPages
    const countResult = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count 
       FROM lms_questions_collections 
       WHERE collection_id = ?`,
      [collectionId]
    );
    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // 2. Lấy dữ liệu câu hỏi có phân trang
    const questions = await query<any[]>(
      `SELECT q.*, l.name as lesson_name
       FROM lms_questions q
       JOIN lms_questions_collections qc ON q.id = qc.question_id
       LEFT JOIN lms_questions_lessons ql ON q.id = ql.question_id
       LEFT JOIN lms_lessons l ON ql.lesson_id = l.id
       WHERE qc.collection_id = ?
       ORDER BY qc.created_at ASC
       LIMIT ? OFFSET ?`,
      [collectionId, pageSize, offset]
    );

    // Lấy options cho từng câu hỏi
    for (const q of questions) {
      const options = await query<any[]>(
        'SELECT * FROM lms_options WHERE question_id = ? ORDER BY `order` ASC',
        [q.id]
      );
      q.options = options;
    }

    return {
      data: questions,
      totalPages,
      totalCount,
      page
    };
  } catch (error) {
    console.error('Error fetching collection questions:', error);
    return {
      data: [],
      totalPages: 0,
      totalCount: 0,
      page: 1
    };
  }
}
