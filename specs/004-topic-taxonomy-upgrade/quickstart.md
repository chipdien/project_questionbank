# Quickstart Validation Guide: Topic & Tagging Upgrade

Tài liệu này hướng dẫn cách chạy kịch bản tự động để kiểm tra và xác thực các tính năng đệ quy của Topic, Materialized Path và hệ thống Tagging hoạt động chính xác.

## 1. Chuẩn bị (Prerequisites)

1. Đảm bảo file `.env` chứa biến môi trường kết nối database hợp lệ:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/vietelite_qb"
   ```
2. Chạy migrate để cập nhật cấu trúc database:
   ```bash
   npx prisma migrate dev --name upgrade_topic_taxonomy
   ```
3. Tạo dữ liệu giả lập (seed) hoặc chạy script test.

## 2. Kịch bản xác thực 1: Tạo cây chủ đề và kiểm tra Materialized Path

Tạo một script test tạm thời tại `tests/test-taxonomy.ts` để kiểm tra:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testTaxonomy() {
  console.log('--- Bắt đầu kiểm tra cấu trúc cây ---');

  // 1. Tạo node gốc (Syllabus)
  const root = await prisma.lms_topics.create({
    data: {
      title: 'Toán Tư Duy Lớp 5',
      parent_id: null,
      path: '' // Tạm thời để trống để script update sau khi có ID
    }
  });
  
  // Cập nhật path cho root node: {id}/
  const rootPath = `${root.id}/`;
  const updatedRoot = await prisma.lms_topics.update({
    where: { id: root.id },
    data: { path: rootPath }
  });
  console.log('Root Node Created:', updatedRoot);

  // 2. Tạo node con (Topic)
  const child = await prisma.lms_topics.create({
    data: {
      title: 'Hình Học',
      parent_id: root.id,
      path: `${rootPath}` // Sẽ được cập nhật chính xác sau
    }
  });
  const childPath = `${rootPath}${child.id}/`;
  const updatedChild = await prisma.lms_topics.update({
    where: { id: child.id },
    data: { path: childPath }
  });
  console.log('Child Node Created:', updatedChild);

  // 3. Truy vấn tìm con cháu bằng path
  const descendants = await prisma.lms_topics.findMany({
    where: {
      path: {
        startsWith: rootPath
      }
    }
  });
  console.log('Số lượng con cháu tìm thấy dưới node gốc:', descendants.length);
  if (descendants.length >= 2) {
    console.log('✔ ĐẠT: Tìm kiếm con cháu bằng Materialized Path thành công.');
  } else {
    console.error('❌ THẤT BẠI: Không tìm thấy đầy đủ con cháu.');
  }
}

testTaxonomy().catch(console.error).finally(() => prisma.$disconnect());
```

*Lệnh chạy script test:*
```bash
npx tsx tests/test-taxonomy.ts
```

## 3. Kịch bản xác thực 2: Đánh tag và truy vấn theo tag

Kiểm tra liên kết câu hỏi với các thẻ tag mới:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testTagging() {
  console.log('--- Bắt đầu kiểm tra Tagging ---');

  // 1. Tạo tag mới
  const tag = await prisma.lms_tags.create({
    data: {
      name: 'phương pháp sơ đồ',
      category: 'METHOD'
    }
  });

  // 2. Gán tag vào câu hỏi
  const questionId = 1n; // Giả sử câu hỏi ID 1 tồn tại
  const link = await prisma.lms_questions_tags.create({
    data: {
      question_id: questionId,
      tag_id: tag.id
    }
  });
  console.log('Gán tag thành công:', link);

  // 3. Tìm kiếm câu hỏi có tag cụ thể
  const taggedQuestions = await prisma.lms_questions.findMany({
    where: {
      tags: {
        some: {
          tag: {
            name: 'phương pháp sơ đồ'
          }
        }
      }
    }
  });
  console.log('Tìm thấy câu hỏi có tag:', taggedQuestions.length);
  if (taggedQuestions.length > 0) {
    console.log('✔ ĐẠT: Gán tag và tìm kiếm theo tag thành công.');
  } else {
    console.error('❌ THẤT BẠI: Không tìm thấy câu hỏi đã gắn tag.');
  }
}

testTagging().catch(console.error).finally(() => prisma.$disconnect());
```
