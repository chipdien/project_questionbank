import fs from 'fs';
import path from 'path';

// 1. Load environment variables from .env manually before any imports use them
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim().replace(/\r/g, '');
        const value = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '').replace(/\r/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = value;
        }
      }
    });
    console.log('[Script] Loaded environment variables from .env file successfully.');
  } else {
    console.warn('[Script] .env file not found. Using system environment variables.');
  }
} catch (err) {
  console.error('[Script] Error loading .env file:', err);
}

async function runMigration() {
  // Now we can import database pool and helper safely after env is loaded
  const { default: pool } = await import('../src/lib/db');
  const { replaceMathpixImagesInText } = await import('../src/lib/utils/s3-utils');
  console.log('\n========================================================');
  console.log('🚀 BẮT ĐẦU TIẾN TRÌNH DI CƯ HÌNH ẢNH MATHPIX CDN SANG S3');
  console.log('========================================================\n');

  try {
    let totalDocumentsMigrated = 0;
    let totalQuestionsMigrated = 0;
    let totalOptionsMigrated = 0;
    let totalTasksMigrated = 0;
    let totalCustomDocsMigrated = 0;

    // --- 1. Di cư bảng lms_documents ---
    console.log('📁 Đang kiểm tra bảng lms_documents...');
    const [docs] = await pool.query<any[]>(
      "SELECT id, title, content FROM lms_documents WHERE content LIKE '%images.mathpix.com%' OR content LIKE '%cdn.mathpix.com%'"
    );
    console.log(`-> Tìm thấy ${docs.length} tài liệu chứa hình ảnh Mathpix CDN.`);
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      console.log(`   [${i + 1}/${docs.length}] Đang di cư tài liệu: "${doc.title}" (ID: ${doc.id})`);
      const updatedContent = await replaceMathpixImagesInText(doc.content);
      if (updatedContent !== doc.content) {
        await pool.query('UPDATE lms_documents SET content = ? WHERE id = ?', [updatedContent, doc.id]);
        totalDocumentsMigrated++;
      }
    }

    // --- 2. Di cư bảng lms_questions ---
    console.log('\n❓ Đang kiểm tra bảng lms_questions...');
    const [questions] = await pool.query<any[]>(
      `SELECT id, content, statement, hint FROM lms_questions 
       WHERE content LIKE '%images.mathpix.com%' OR content LIKE '%cdn.mathpix.com%'
          OR statement LIKE '%images.mathpix.com%' OR statement LIKE '%cdn.mathpix.com%'
          OR hint LIKE '%images.mathpix.com%' OR hint LIKE '%cdn.mathpix.com%'`
    );
    console.log(`-> Tìm thấy ${questions.length} câu hỏi chứa hình ảnh Mathpix CDN.`);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`   [${i + 1}/${questions.length}] Đang di cư câu hỏi ID: ${q.id}`);
      const updatedContent = await replaceMathpixImagesInText(q.content);
      const updatedStatement = await replaceMathpixImagesInText(q.statement);
      const updatedHint = await replaceMathpixImagesInText(q.hint);

      if (updatedContent !== q.content || updatedStatement !== q.statement || updatedHint !== q.hint) {
        await pool.query(
          'UPDATE lms_questions SET content = ?, statement = ?, hint = ? WHERE id = ?',
          [updatedContent, updatedStatement, updatedHint, q.id]
        );
        totalQuestionsMigrated++;
      }
    }

    // --- 3. Di cư bảng lms_options ---
    console.log('\n🔠 Đang kiểm tra bảng lms_options...');
    const [options] = await pool.query<any[]>(
      "SELECT id, content FROM lms_options WHERE content LIKE '%images.mathpix.com%' OR content LIKE '%cdn.mathpix.com%'"
    );
    console.log(`-> Tìm thấy ${options.length} lựa chọn câu hỏi chứa hình ảnh Mathpix CDN.`);

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      console.log(`   [${i + 1}/${options.length}] Đang di cư đáp án lựa chọn ID: ${opt.id}`);
      const updatedContent = await replaceMathpixImagesInText(opt.content);
      if (updatedContent !== opt.content) {
        await pool.query('UPDATE lms_options SET content = ? WHERE id = ?', [updatedContent, opt.id]);
        totalOptionsMigrated++;
      }
    }

    // --- 4. Di cư bảng lms_processing_tasks ---
    console.log('\n⚙️ Đang kiểm tra bảng lms_processing_tasks...');
    const [tasks] = await pool.query<any[]>(
      "SELECT id, file_name, raw_text FROM lms_processing_tasks WHERE raw_text LIKE '%images.mathpix.com%' OR raw_text LIKE '%cdn.mathpix.com%'"
    );
    console.log(`-> Tìm thấy ${tasks.length} task xử lý chứa hình ảnh Mathpix CDN.`);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(`   [${i + 1}/${tasks.length}] Đang di cư task: "${task.file_name}" (ID: ${task.id})`);
      const updatedRawText = await replaceMathpixImagesInText(task.raw_text);
      if (updatedRawText !== task.raw_text) {
        await pool.query('UPDATE lms_processing_tasks SET raw_text = ? WHERE id = ?', [updatedRawText, task.id]);
        totalTasksMigrated++;
      }
    }

    // --- 5. Di cư bảng lms_documents_custom ---
    console.log('\n📄 Đang kiểm tra bảng lms_documents_custom...');
    try {
      const [customDocs] = await pool.query<any[]>(
        "SELECT id, title, content_blocks FROM lms_documents_custom WHERE content_blocks LIKE '%images.mathpix.com%' OR content_blocks LIKE '%cdn.mathpix.com%'"
      );
      console.log(`-> Tìm thấy ${customDocs.length} tài liệu custom chứa hình ảnh Mathpix CDN.`);

      for (let i = 0; i < customDocs.length; i++) {
        const cDoc = customDocs[i];
        console.log(`   [${i + 1}/${customDocs.length}] Đang di cư tài liệu custom: "${cDoc.title}" (ID: ${cDoc.id})`);
        const updatedContentBlocks = await replaceMathpixImagesInText(cDoc.content_blocks);
        if (updatedContentBlocks !== cDoc.content_blocks) {
          await pool.query('UPDATE lms_documents_custom SET content_blocks = ? WHERE id = ?', [updatedContentBlocks, cDoc.id]);
          totalCustomDocsMigrated++;
        }
      }
    } catch (dbErr: any) {
      console.warn('⚠️ Lỗi kiểm tra bảng lms_documents_custom (có thể bảng này không tồn tại hoặc lỗi):', dbErr.message);
    }

    console.log('\n========================================================');
    console.log('🎉 TIẾN TRÌNH DI CƯ HOÀN THÀNH XUẤT SẮC!');
    console.log('========================================================');
    console.log(`📊 Thống kê kết quả cập nhật:`);
    console.log(`- Tài liệu lms_documents:     ${totalDocumentsMigrated} bản ghi`);
    console.log(`- Câu hỏi lms_questions:      ${totalQuestionsMigrated} bản ghi`);
    console.log(`- Lựa chọn lms_options:       ${totalOptionsMigrated} bản ghi`);
    console.log(`- Task lms_processing_tasks:  ${totalTasksMigrated} bản ghi`);
    console.log(`- Tài liệu lms_documents_custom: ${totalCustomDocsMigrated} bản ghi`);
    console.log('========================================================\n');

  } catch (error: any) {
    console.error('\n❌ Có lỗi xảy ra trong quá trình di cư:', error);
  } finally {
    await pool.end();
    console.log('[Script] Đã đóng kết nối Database.');
  }
}

runMigration();
