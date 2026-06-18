'use server';

import { getCurrentUser } from '@/lib/utils/auth.utils';
import { serializeBigInt } from '@/lib/utils/serialization.utils';
import { QuestionManualService, CreateQuestionInput } from '@/lib/services/question-manual.service';
import { revalidatePath } from 'next/cache';

/**
 * Server Action xử lý việc tạo câu hỏi thủ công.
 */
export async function createManualQuestionAction(
  input: Omit<CreateQuestionInput, 'userId'>
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id ? Number(user.id) : null;

    console.log("=== createManualQuestionAction Input ===", JSON.stringify(input, null, 2));

    const result = await QuestionManualService.createQuestion({
      ...input,
      userId,
    });

    // Refresh dữ liệu ở ngân hàng câu hỏi và bộ sưu tập
    revalidatePath('/question-bank');
    revalidatePath('/collection');

    return {
      success: true,
      data: serializeBigInt(result),
    };
  } catch (error: any) {
    console.error('Lỗi khi tạo câu hỏi thủ công:', error);
    return {
      success: false,
      error: error.message || 'Lỗi hệ thống khi lưu câu hỏi.',
    };
  }
}
