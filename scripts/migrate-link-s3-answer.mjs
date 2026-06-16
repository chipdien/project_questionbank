// One-off migration: add link_s3_answer column to lms_documents
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  // Check if column already exists to make this idempotent
  const cols = await prisma.$queryRawUnsafe(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'lms_documents' AND COLUMN_NAME = 'link_s3_answer'`
  );

  if (Array.isArray(cols) && cols.length > 0) {
    console.log('✓ Cột link_s3_answer đã tồn tại, không cần migrate.');
  } else {
    await prisma.$executeRawUnsafe('ALTER TABLE lms_documents ADD COLUMN link_s3_answer TEXT DEFAULT NULL');
    console.log('✓ Đã thêm cột link_s3_answer vào lms_documents thành công.');
  }
} catch (err) {
  console.error('✗ Migration thất bại:', err.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
