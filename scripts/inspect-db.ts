import { prisma } from '../src/lib/db';

async function main() {
  console.log('--- DIFFICULTIES ---');
  const difficulties = await prisma.lms_difficulties.findMany();
  console.log(JSON.stringify(difficulties, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
