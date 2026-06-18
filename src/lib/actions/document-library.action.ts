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
