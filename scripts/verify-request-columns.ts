import { prisma } from '@/lib/db';
async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='lms_requests' AND COLUMN_NAME IN ('question_id','status','admin_note')"
  );
  const names = rows.map(r => r.COLUMN_NAME).sort();
  console.log('Found columns:', names);
  console.assert(names.length === 3, 'Expected 3 new columns');
  console.log(names.length === 3 ? 'VERIFY OK' : 'VERIFY FAILED');
  await prisma.$disconnect();
}
main().catch(async e => { console.error('VERIFY FAILED', e); await prisma.$disconnect(); process.exit(1); });
