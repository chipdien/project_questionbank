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
