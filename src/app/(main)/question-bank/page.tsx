export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import QuestionBankManager from '@/app/(main)/question-bank/components/QuestionBankManager';
import { getCurrentUser } from '@/lib/utils/auth-utils';

interface Document {
  id: number;
  title: string;
  created_at: string;
}

interface Lesson {
  id: number;
  name: string;
  grade?: string;
}

export default async function QuestionBankPage() {
  // Fetch initial documents and lessons
  let documents: Document[] = [];
  let lessons: Lesson[] = [];

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;

    // Lọc: của mình OR public OR cũ (NULL) OR Admin
    documents = await query<Document[]>(
      `SELECT id, title, created_at 
       FROM lms_documents 
       WHERE created_by_id = ? OR \`public\` = '1' OR created_by_id IS NULL OR ? >= 5
       ORDER BY created_at DESC`,
      [userId, levelRank]
    );

    lessons = await query<Lesson[]>('SELECT id, name, grade FROM lms_lessons ORDER BY name ASC');
  } catch (error) {
    console.error("Failed to load data:", error);
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface font-headline">Ngân hàng câu hỏi</h1>
      </div>

      <QuestionBankManager initialDocuments={documents} lessons={lessons} />
    </div>
  );
}

