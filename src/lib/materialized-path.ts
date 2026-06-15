import prisma from './db/prisma';

/**
 * Sinh ra materialized path cho một node dựa trên parentId và selfId của nó.
 */
export async function generatePath(parentId: bigint | null, selfId: bigint): Promise<string> {
  if (!parentId) {
    return `${selfId}/`;
  }

  const parent = await prisma.lms_topics.findUnique({
    where: { id: parentId },
    select: { path: true }
  });

  if (!parent || !parent.path) {
    return `${selfId}/`;
  }

  return `${parent.path}${selfId}/`;
}

/**
 * Cập nhật đệ quy toàn bộ các path của con cháu khi một node cha thay đổi path của nó.
 */
export async function updateDescendantsPaths(
  topicId: bigint,
  oldPath: string,
  newPath: string
): Promise<void> {
  // Tìm tất cả các node con cháu có path bắt đầu bằng oldPath (không bao gồm chính node hiện tại)
  const descendants = await prisma.lms_topics.findMany({
    where: {
      path: {
        startsWith: oldPath
      },
      id: {
        not: topicId
      }
    },
    select: {
      id: true,
      path: true
    }
  });

  if (descendants.length === 0) return;

  // Thực hiện update hàng loạt trong transaction
  await prisma.$transaction(
    descendants.map((child) => {
      const childOldPath = child.path || '';
      // Thay thế tiền tố oldPath bằng newPath mới
      const childNewPath = childOldPath.startsWith(oldPath)
        ? newPath + childOldPath.slice(oldPath.length)
        : childOldPath;

      return prisma.lms_topics.update({
        where: { id: child.id },
        data: { path: childNewPath }
      });
    })
  );
}
