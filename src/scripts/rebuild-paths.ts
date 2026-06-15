import prisma from '../lib/db/prisma';

async function rebuildPaths() {
  console.log('=== BẮT ĐẦU KHÔI PHỤC VÀ ĐÁNH LẠI TOÀN BỘ PATH CHO LMS_TOPICS ===');

  let updatedCount = 0;

  async function rebuildNode(nodeId: bigint, parentPath: string) {
    const newPath = `${parentPath}${nodeId}/`;
    
    // Cập nhật path cho node hiện tại
    await prisma.lms_topics.update({
      where: { id: nodeId },
      data: { path: newPath }
    });
    updatedCount++;

    // Lấy tất cả các node con trực tiếp
    const children = await prisma.lms_topics.findMany({
      where: { parent_id: nodeId },
      select: { id: true }
    });

    for (const child of children) {
      await rebuildNode(child.id, newPath);
    }
  }

  try {
    // 1. Tìm tất cả các root nodes (các node không có parent_id)
    console.log('Đang tìm kiếm các chủ đề gốc...');
    const rootNodes = await prisma.lms_topics.findMany({
      where: { parent_id: null },
      select: { id: true, title: true }
    });

    console.log(`Tìm thấy ${rootNodes.length} chủ đề gốc.`);

    // 2. Chạy đệ quy để cập nhật lại path từ gốc xuống ngọn
    for (const root of rootNodes) {
      console.log(`Đang xử lý nhánh gốc: "${root.title}" (ID: ${root.id})`);
      await rebuildNode(root.id, '');
    }

    console.log(`=== HOÀN TẤT: Đã cập nhật lại đường dẫn cho ${updatedCount} chủ đề thành công. ===`);
  } catch (error) {
    console.error('Đã xảy ra lỗi khi xây dựng lại đường dẫn:', error);
  }
}

rebuildPaths()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
