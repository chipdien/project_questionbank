import pool from '../db';
import { ResultSetHeader } from 'mysql2';
import { QuestionParserService } from './ai';

export class IngestService {
  /**
   * Khởi tạo task xử lý mới.
   */
  static async createTask(fileName: string, fileHash: string) {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO lms_processing_tasks (file_hash, file_name, status) VALUES (?, ?, ?)',
      [fileHash, fileName, 'PENDING']
    );
    return result.insertId;
  }

  static async checkDuplicatesByHash(fileHash: string): Promise<any[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT t.document_id, d.content, d.link_s3, d.public, d.created_by_id, u.username as uploader_name 
       FROM lms_processing_tasks t
       JOIN lms_documents d ON t.document_id = d.id
       LEFT JOIN lms_users u ON d.created_by_id = u.id
       WHERE t.file_hash = ? AND t.status = "COMPLETED" AND t.document_id IS NOT NULL`,
      [fileHash]
    );
    return rows;
  }

  /**
   * Cập nhật trạng thái của task.
   */
  static async updateTaskStatus(taskId: number, status: string, rawText?: string, documentId?: number) {
    let query = 'UPDATE lms_processing_tasks SET status = ?';
    const params: any[] = [status];

    if (rawText !== undefined) {
      query += ', raw_text = ?';
      params.push(rawText);
    }
    if (documentId !== undefined) {
      query += ', document_id = ?';
      params.push(documentId);
    }

    query += ' WHERE id = ?';
    params.push(taskId);

    await pool.query(query, params);
  }

  /**
   * Phân tích văn bản thô bằng Gemini.
   */
  static async processAi(rawText: string, rawAnswerText?: string) {
    return await QuestionParserService.parseQuestions(rawText, rawAnswerText);
  }

  /**
   * Lưu dữ liệu đã có cấu trúc vào CSDL.
   */
  static async saveToDatabase(taskId: number, fileName: string, rawText: string, structuredData: any, isPublic: boolean = false, linkS3: string | null = null, userId: number | null = null, linkS3Answer: string | null = null) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const publicVal = isPublic ? '1' : '0';

      // 1. Insert into lms_documents
      const [docResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO lms_documents (title, content, `public`, link_s3, link_s3_answer, created_at, updated_at, created_by_id, updated_by_id, teacher_owned) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)',
        [fileName, rawText, publicVal, linkS3, linkS3Answer, userId, userId, userId]
      );
      const documentId = docResult.insertId;

      const questions = structuredData.questions || [];

      for (const q of questions) {
        // 2. Insert into lms_questions
        const [questionResult] = await connection.execute<ResultSetHeader>(
          'INSERT INTO lms_questions (content, statement, hint, question_type, created_at, updated_at, owned_by_id, teacher_owned_by_id) VALUES (?, ?, ?, ?, NOW(), NOW(), NULL, NULL)',
          [q.statement, q.statement, q.hint || null, q.question_type || 'SINGLE_CHOICE']
        );
        const questionId = questionResult.insertId;

        // 3. Link question to document
        await connection.execute(
          'INSERT INTO lms_questions_documents (document_id, question_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
          [documentId, questionId]
        );

        // 4. Insert options if any
        if (q.options && Array.isArray(q.options)) {
          for (const opt of q.options) {
            await connection.execute(
              'INSERT INTO lms_options (question_id, content, `order`, weight, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
              [questionId, opt.content, opt.order, opt.weight]
            );
          }
        }
      }

      await connection.commit();
      connection.release(); // Giải phóng trước khi update task

      // Update task
      await this.updateTaskStatus(taskId, 'COMPLETED', undefined, documentId);

      return { success: true, documentId, questionsCount: questions.length };
    } catch (error: any) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      await this.updateTaskStatus(taskId, 'FAILED');
      console.error('Save to Database error:', error);
      throw new Error(`Lỗi khi lưu vào CSDL: ${error.message}`);
    }
  }

  static async reuseDocument(taskId: number, fileName: string, existingData: any, isPublic: boolean, userId: number | null) {
    const connection = await pool.getConnection();

    try {
      console.log(`[ReuseDocument] Start cloning document ID: ${existingData.document_id} for User ID: ${userId}`);
      await connection.beginTransaction();

      const publicVal = isPublic ? '1' : '0';

      // 1. Insert bản ghi document mới cho user hiện tại
      console.log(`[ReuseDocument] Inserting new document record`);
      const [docResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO lms_documents (title, content, `public`, link_s3, created_at, updated_at, created_by_id, updated_by_id, teacher_owned) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)',
        [fileName, existingData.content, publicVal, existingData.link_s3, userId, userId, userId]
      );
      const newDocumentId = docResult.insertId;

      // 2. Lấy các câu hỏi từ document cũ và link sang document mới
      console.log(`[ReuseDocument] Fetching linked questions`);
      const [questions] = await connection.execute<any[]>(
        'SELECT question_id FROM lms_questions_documents WHERE document_id = ?',
        [existingData.document_id]
      );

      if (questions.length > 0) {
        console.log(`[ReuseDocument] Linking ${questions.length} questions to new document`);
        const values = questions.map(q => [newDocumentId, q.question_id]);
        const placeholders = values.map(() => '(?, ?, NOW(), NOW())').join(', ');
        const flatValues = values.map(v => [...v]).flat();

        // CHÚ Ý: Dùng query thay cho execute để hỗ trợ string SQL động rất dài không gián đoạn Pool!
        await connection.query(
          `INSERT INTO lms_questions_documents (document_id, question_id, created_at, updated_at) VALUES ${placeholders}`,
          flatValues
        );
      }

      await connection.commit();
      console.log(`[ReuseDocument] Transaction committed successfully`);
      connection.release(); // Giải phóng connection để tránh deadlock

      // Update task (Hàm này lại gọi pool.query, nếu pool bị giới hạn mà chưa release ở trên sẽ treo)
      console.log(`[ReuseDocument] Updating task status`);
      await this.updateTaskStatus(taskId, 'COMPLETED', undefined, newDocumentId);

      console.log(`[ReuseDocument] Finished`);
      return { success: true, documentId: newDocumentId, questionsCount: questions.length };
    } catch (error: any) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error('[ReuseDocument] Reuse Document error:', error);
      throw new Error(`Lỗi khi tái sử dụng tài liệu: ${error.message}`);
    }
  }
}
