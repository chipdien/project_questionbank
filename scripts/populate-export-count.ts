import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu đồng bộ số lần sử dụng câu hỏi...');

  // 1. Nhóm và đếm số lần sử dụng của từng câu hỏi trong bảng liên kết đề custom
  const usages = await prisma.lms_documents_custom_questions.groupBy({
    by: ['question_id'],
    _count: {
      id: true,
    },
  });

  console.log(`Tìm thấy ${usages.length} câu hỏi đã được dùng trong các đề xuất.`);

  // 2. Cập nhật tuần tự vào bảng lms_questions
  let count = 0;
  for (const usage of usages) {
    const qId = usage.question_id;
    const useCount = usage._count.id;

    await prisma.lms_questions.update({
      where: { id: BigInt(qId) },
      data: {
        export_count: useCount,
      },
    });
    count++;
    if (count % 50 === 0) {
      console.log(`Đã cập nhật ${count}/${usages.length} câu hỏi...`);
    }
  }

  console.log('Hoàn thành cập nhật số lần sử dụng câu hỏi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
