import { prisma } from '@/lib/db';

/**
 * Trả về danh sách question_id thuộc các chủ đề đã chọn VÀ toàn bộ chủ đề con cháu
 * (so khớp lms_topics.path bắt đầu bằng path của chủ đề được chọn).
 * Trả [] nếu các chủ đề được chọn không có path hợp lệ.
 */
export async function resolveTopicQuestionIds(topicIds: number[]): Promise<bigint[]> {
  if (!topicIds || topicIds.length === 0) return [];

  const selectedTopics = await prisma.lms_topics.findMany({
    where: { id: { in: topicIds.map(BigInt) } },
    select: { path: true },
  });

  const orConditions = selectedTopics
    .filter(t => t.path)
    .map(t => ({ path: { startsWith: t.path! } }));

  if (orConditions.length === 0) return [];

  const descendantTopics = await prisma.lms_topics.findMany({
    where: { OR: orConditions },
    select: { id: true },
  });
  const descendantIds = descendantTopics.map(t => t.id);

  const relations = await prisma.lms_topics_questions.findMany({
    where: { topic_id: { in: descendantIds } },
    select: { question_id: true },
  });

  return Array.from(new Set(relations.map(r => r.question_id)));
}

/**
 * Trả về danh sách question_id khớp bộ tag: OR trong cùng category, AND giữa các category.
 * Không cần seed bên ngoài — tự tính từ tag. Trả [] nếu không có tag hợp lệ hoặc không câu nào khớp.
 */
export async function getQuestionIdsByTags(tagIds: number[]): Promise<bigint[]> {
  if (!tagIds || tagIds.length === 0) return [];

  const selectedTags = await prisma.lms_tags.findMany({
    where: { id: { in: tagIds.map(BigInt) } },
    select: { id: true, category: true },
  });

  const tagsByCategory: Record<string, bigint[]> = {};
  for (const t of selectedTags) {
    const cat = t.category.toUpperCase();
    (tagsByCategory[cat] ||= []).push(t.id);
  }

  const categorySets: Set<string>[] = [];
  for (const ids of Object.values(tagsByCategory)) {
    const rels = await prisma.lms_questions_tags.findMany({
      where: { tag_id: { in: ids } },
      select: { question_id: true },
    });
    categorySets.push(new Set(rels.map(r => r.question_id.toString())));
  }

  if (categorySets.length === 0) return [];

  let acc: Set<string> = categorySets[0];
  for (let i = 1; i < categorySets.length; i++) {
    const next = categorySets[i];
    acc = new Set(Array.from(acc).filter(x => next.has(x)));
  }

  return Array.from(acc).map(s => BigInt(s));
}

/**
 * Trả về danh sách question_id ĐÃ phân loại đầy đủ = có chủ đề VÀ có tag.
 * Dùng cho bộ lọc "chưa phân loại" (notIn tập này).
 */
export async function getClassifiedQuestionIds(): Promise<bigint[]> {
  const topicQ = await prisma.lms_topics_questions.findMany({
    select: { question_id: true },
    distinct: ['question_id'],
  });
  const tagQ = await prisma.lms_questions_tags.findMany({
    select: { question_id: true },
    distinct: ['question_id'],
  });

  const tagSet = new Set(tagQ.map(r => r.question_id.toString()));
  return topicQ
    .filter(r => tagSet.has(r.question_id.toString()))
    .map(r => r.question_id);
}
