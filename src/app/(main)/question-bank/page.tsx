export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import QuestionBankManager from '@/app/(main)/question-bank/components/QuestionBankManager';
import { getCurrentUser, isUserAdmin } from '@/lib/utils/auth-utils';

interface Document {
  id: number;
  title: string;
  created_at: string;
  public?: string | null;
  link_s3?: string | null;
  link_s3_answer?: string | null;
  teacher_name?: string | null;
  created_by_id?: number | null;
}

interface Lesson {
  id: number;
  name: string;
  grade?: string;
}

export default async function QuestionBankPage() {
  // Fetch initial documents, lessons, and dynamic difficulties
  let documents: Document[] = [];
  let lessons: Lesson[] = [];
  let difficulties: any[] = [];
  let isAdmin = false;

  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const levelRank = user?.level_rank || 0;
    isAdmin = levelRank >= 5;

    // Lọc: của mình OR public OR cũ (NULL) OR Admin
    documents = await query<Document[]>(
      `SELECT d.id, d.title, d.created_at, d.\`public\`, d.link_s3, d.link_s3_answer, COALESCE(u.nickname, u.username) as teacher_name, d.created_by_id
       FROM lms_documents d
       LEFT JOIN lms_users u ON d.created_by_id = u.id
       WHERE d.created_by_id = ? OR d.\`public\` = '1' OR d.created_by_id IS NULL OR ? >= 5
       ORDER BY d.created_at DESC`,
      [userId, levelRank]
    );

    lessons = await query<Lesson[]>('SELECT id, name, grade FROM lms_lessons ORDER BY name ASC');
    difficulties = await query<any[]>('SELECT id, name, color_code, display_order FROM lms_difficulties ORDER BY display_order ASC, name ASC');
  } catch (error) {
    console.error("Failed to load data:", error);
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface font-headline">Ngân hàng câu hỏi</h1>
      </div>

      <QuestionBankManager 
        initialDocuments={documents} 
        lessons={lessons} 
        initialDifficulties={difficulties}
        isAdmin={isAdmin}
      />
    </div>
  );
}

