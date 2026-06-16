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
  // Now we can import prisma safely after env is loaded
  const { default: prisma } = await import('../src/lib/db/prisma');
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
    const docs = await prisma.lms_documents.findMany({
      where: {
        OR: [
          { content: { contains: 'images.mathpix.com' } },
          { content: { contains: 'cdn.mathpix.com' } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });
    console.log(`-> Tìm thấy ${docs.length} tài liệu chứa hình ảnh Mathpix CDN.`);
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      console.log(`   [${i + 1}/${docs.length}] Đang di cư tài liệu: "${doc.title}" (ID: ${doc.id})`);
      const updatedContent = await replaceMathpixImagesInText(doc.content || '');
      if (updatedContent !== doc.content) {
        await prisma.lms_documents.update({
          where: { id: doc.id },
          data: { content: updatedContent },
        });
        totalDocumentsMigrated++;
      }
    }

    // --- 2. Di cư bảng lms_questions ---
    console.log('\n❓ Đang kiểm tra bảng lms_questions...');
    const questions = await prisma.lms_questions.findMany({
      where: {
        OR: [
          { content: { contains: 'images.mathpix.com' } },
          { content: { contains: 'cdn.mathpix.com' } },
          { statement: { contains: 'images.mathpix.com' } },
          { statement: { contains: 'cdn.mathpix.com' } },
          { hint: { contains: 'images.mathpix.com' } },
          { hint: { contains: 'cdn.mathpix.com' } },
        ],
      },
      select: {
        id: true,
        content: true,
        statement: true,
        hint: true,
      },
    });
    console.log(`-> Tìm thấy ${questions.length} câu hỏi chứa hình ảnh Mathpix CDN.`);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`   [${i + 1}/${questions.length}] Đang di cư câu hỏi ID: ${q.id}`);
      const updatedContent = await replaceMathpixImagesInText(q.content || '');
      const updatedStatement = await replaceMathpixImagesInText(q.statement || '');
      const updatedHint = await replaceMathpixImagesInText(q.hint || '');

      if (updatedContent !== q.content || updatedStatement !== q.statement || updatedHint !== q.hint) {
        await prisma.lms_questions.update({
          where: { id: q.id },
          data: {
            content: updatedContent,
            statement: updatedStatement,
            hint: updatedHint,
          },
        });
        totalQuestionsMigrated++;
      }
    }

    // --- 3. Di cư bảng lms_options ---
    console.log('\n🔠 Đang kiểm tra bảng lms_options...');
    const options = await prisma.lms_options.findMany({
      where: {
        OR: [
          { content: { contains: 'images.mathpix.com' } },
          { content: { contains: 'cdn.mathpix.com' } },
        ],
      },
      select: {
        id: true,
        content: true,
      },
    });
    console.log(`-> Tìm thấy ${options.length} lựa chọn câu hỏi chứa hình ảnh Mathpix CDN.`);

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      console.log(`   [${i + 1}/${options.length}] Đang di cư đáp án lựa chọn ID: ${opt.id}`);
      const updatedContent = await replaceMathpixImagesInText(opt.content || '');
      if (updatedContent !== opt.content) {
        await prisma.lms_options.update({
          where: { id: opt.id },
          data: { content: updatedContent },
        });
        totalOptionsMigrated++;
      }
    }

    // --- 4. Di cư bảng lms_processing_tasks ---
    console.log('\n⚙️ Đang kiểm tra bảng lms_processing_tasks...');
    const tasks = await prisma.lms_processing_tasks.findMany({
      where: {
        OR: [
          { raw_text: { contains: 'images.mathpix.com' } },
          { raw_text: { contains: 'cdn.mathpix.com' } },
        ],
      },
      select: {
        id: true,
        file_name: true,
        raw_text: true,
      },
    });
    console.log(`-> Tìm thấy ${tasks.length} task xử lý chứa hình ảnh Mathpix CDN.`);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(`   [${i + 1}/${tasks.length}] Đang di cư task: "${task.file_name}" (ID: ${task.id})`);
      const updatedRawText = await replaceMathpixImagesInText(task.raw_text || '');
      if (updatedRawText !== task.raw_text) {
        await prisma.lms_processing_tasks.update({
          where: { id: task.id },
          data: { raw_text: updatedRawText },
        });
        totalTasksMigrated++;
      }
    }

    // --- 5. Di cư bảng lms_documents_custom ---
    console.log('\n📄 Đang kiểm tra bảng lms_documents_custom...');
    try {
      const customDocs = await prisma.lms_documents_custom.findMany({
        where: {
          OR: [
            { content_blocks: { contains: 'images.mathpix.com' } },
            { content_blocks: { contains: 'cdn.mathpix.com' } },
          ],
        },
        select: {
          id: true,
          title: true,
          content_blocks: true,
        },
      });
      console.log(`-> Tìm thấy ${customDocs.length} tài liệu custom chứa hình ảnh Mathpix CDN.`);

      for (let i = 0; i < customDocs.length; i++) {
        const cDoc = customDocs[i];
        console.log(`   [${i + 1}/${customDocs.length}] Đang di cư tài liệu custom: "${cDoc.title}" (ID: ${cDoc.id})`);
        const updatedContentBlocks = await replaceMathpixImagesInText(cDoc.content_blocks || '');
        if (updatedContentBlocks !== cDoc.content_blocks) {
          await prisma.lms_documents_custom.update({
            where: { id: cDoc.id },
            data: { content_blocks: updatedContentBlocks },
          });
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
    await prisma.$disconnect();
    console.log('[Script] Đã đóng kết nối Database.');
  }
}

runMigration();
