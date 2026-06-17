import { resolveTopicQuestionIds, getQuestionIdsByTags, getClassifiedQuestionIds } from '@/lib/services/question-filters';
import { prisma } from '@/lib/db';

async function main() {
  console.assert((await resolveTopicQuestionIds([])).length === 0, 'topic [] should be empty');
  console.assert((await getQuestionIdsByTags([])).length === 0, 'tags [] should be empty');

  const topic = await prisma.lms_topics.findFirst({ where: { path: { not: null } }, select: { id: true } });
  if (topic) {
    const ids = await resolveTopicQuestionIds([Number(topic.id)]);
    console.log(`resolveTopicQuestionIds(${topic.id}) -> ${ids.length} question ids`);
  } else {
    console.log('No topic with path found — skipping recursion check');
  }

  const tags = await prisma.lms_tags.findMany({ take: 50, select: { id: true, category: true } });
  const catA = tags.find(t => t);
  const catB = tags.find(t => catA && t.category !== catA.category);
  if (catA && catB) {
    const both = await getQuestionIdsByTags([Number(catA.id), Number(catB.id)]);
    const onlyA = await getQuestionIdsByTags([Number(catA.id)]);
    const setA = new Set(onlyA.map(String));
    console.assert(both.every(id => setA.has(id.toString())), 'AND result must be subset of category A set');
    console.log(`tags AND across categories -> ${both.length} ids (A alone: ${onlyA.length})`);
  } else {
    console.log('Not enough tag categories — skipping tag check');
  }

  const classified = await getClassifiedQuestionIds();
  console.log(`classified (has topic AND tag) -> ${classified.length} ids`);

  console.log('VERIFY OK');
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('VERIFY FAILED', e); await prisma.$disconnect(); process.exit(1); });
