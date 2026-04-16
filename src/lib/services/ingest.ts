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

  /**
   * Kiểm tra xem file đã được xử lý thành công chưa dựa vào hash.
   * Trả về thông tin document đầy đủ để reuse nếu cần.
   */
  static async checkDuplicate(fileHash: string): Promise<any | null> {
    const [rows] = await pool.query<any[]>(
      `SELECT t.document_id, d.content, d.link_s3, d.created_by_id 
       FROM lms_processing_tasks t
       JOIN lms_documents d ON t.document_id = d.id
       WHERE t.file_hash = ? AND t.status = "COMPLETED" AND t.document_id IS NOT NULL 
       LIMIT 1`,
      [fileHash]
    );
    if (rows.length > 0) {
      return rows[0];
    }
    return null;
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
  static async processAi(rawText: string) {
     return await QuestionParserService.parseQuestions(rawText);
  }

  /**
   * Lưu dữ liệu đã có cấu trúc vào CSDL.
   */
  static async saveToDatabase(taskId: number, fileName: string, rawText: string, structuredData: any, isPublic: boolean = false, linkS3: string | null = null, userId: number | null = null) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const publicVal = isPublic ? '1' : '0';

      // 1. Insert into lms_documents
      const [docResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO lms_documents (title, content, `public`, link_s3, created_at, updated_at, created_by_id) VALUES (?, ?, ?, ?, NOW(), NOW(), ?)',
        [fileName, rawText, publicVal, linkS3, userId]
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
      
      // Update task
      await this.updateTaskStatus(taskId, 'COMPLETED', undefined, documentId);

      return { success: true, documentId, questionsCount: questions.length };
    } catch (error: any) {
      await connection.rollback();
      await this.updateTaskStatus(taskId, 'FAILED');
      console.error('Save to Database error:', error);
      throw new Error(`Lỗi khi lưu vào CSDL: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Tái sử dụng (clone) dữ liệu từ một document có sẵn cho một user mới.
   */
  static async reuseDocument(taskId: number, fileName: string, existingData: any, isPublic: boolean, userId: number | null) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const publicVal = isPublic ? '1' : '0';

      // 1. Insert bản ghi document mới cho user hiện tại (trỏ cùng nội dung và s3_link)
      const [docResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO lms_documents (title, content, `public`, link_s3, created_at, updated_at, created_by_id) VALUES (?, ?, ?, ?, NOW(), NOW(), ?)',
        [fileName, existingData.content, publicVal, existingData.link_s3, userId]
      );
      const newDocumentId = docResult.insertId;

      // 2. Lấy các câu hỏi từ document cũ và link sang document mới
      const [questions] = await connection.execute<any[]>(
        'SELECT question_id FROM lms_questions_documents WHERE document_id = ?',
        [existingData.document_id]
      );

      if (questions.length > 0) {
        const values = questions.map(q => [newDocumentId, q.question_id]);
        const placeholders = values.map(() => '(?, ?, NOW(), NOW())').join(', ');
        const flatValues = values.map(v => [...v]).flat();

        await connection.execute(
          `INSERT INTO lms_questions_documents (document_id, question_id, created_at, updated_at) VALUES ${placeholders}`,
          flatValues
        );
      }

      await connection.commit();
      
      // Update task
      await this.updateTaskStatus(taskId, 'COMPLETED', undefined, newDocumentId);

      return { success: true, documentId: newDocumentId, questionsCount: questions.length };
    } catch (error: any) {
      await connection.rollback();
      console.error('Reuse Document error:', error);
      throw new Error(`Lỗi khi tái sử dụng tài liệu: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}
