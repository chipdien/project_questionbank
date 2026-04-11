import { query } from '@/lib/db';
import QuestionBankManager from '@/app/question-bank/components/QuestionBankManager';

interface Document {
  id: number;
  title: string;
  created_at: string;
}

export default async function QuestionBankPage() {
  // Fetch initial documents
  let documents: Document[] = [];
  try {
    documents = await query<Document[]>('SELECT id, title, created_at FROM lms_documents ORDER BY created_at DESC');
  } catch (error) {
    console.error("Failed to load documents:", error);
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface font-headline mb-2">Ngân hàng câu hỏi</h1>
        <p className="text-on-surface-variant text-sm">
          Chọn tệp bên dưới để xem danh sách câu hỏi và kéo chọn câu hỏi cho bộ sưu tập của bạn.
        </p>
      </div>

      <QuestionBankManager initialDocuments={documents} />
    </div>
  );
}
