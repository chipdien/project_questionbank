'use server';

import { query } from '@/src/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * Tạo một bộ sưu tập mới và gán các câu hỏi vào đó.
 * @param title Tên bộ sưu tập
 * @param selectedIds Danh sách ID câu hỏi được chọn
 */
export async function createCollectionAction(title: string, selectedIds: number[]) {
  if (!title || selectedIds.length === 0) {
    throw new Error('Title and selected questions are required.');
  }

  try {
    const result = await query<any>(
      'INSERT INTO lms_collections (title, teacher_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [title, null]
    );

    const collectionId = result.insertId;

    if (!collectionId) {
      throw new Error('Failed to retrieve insertId for collection.');
    }

    // 2. Insert hàng loạt vào lms_questions_collections
    // Nếu db hỗ trợ bulk insert:
    const values = selectedIds.map(qId => [collectionId, qId]);
    
    for (const qId of selectedIds) {
      await query(
        'INSERT INTO lms_questions_collections (collection_id, question_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [collectionId, qId]
      );
    }

    // Sau khi thành công, revalidate
    revalidatePath('/collection');
    return { success: true };
  } catch (error) {
    console.error('Error in createCollectionAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Lấy danh sách bộ sưu tập (cho trang collection)
 */
export async function getCollectionsAction() {
  try {
    const collections = await query(
      `SELECT c.*, COUNT(cq.question_id) as question_count 
       FROM lms_collections c
       LEFT JOIN lms_questions_collections cq ON c.id = cq.collection_id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return collections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}
