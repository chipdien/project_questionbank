'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/utils/auth-utils';
import { serializeBigInt } from '@/lib/utils/serialization';

export type RequestType = 'EDIT' | 'CLASSIFY' | 'REPORT';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ClassifySuggest {
  grade: number | null;
  topicIds: number[];
  tagIds: number[];
}

const VALID_TYPES: RequestType[] = ['EDIT', 'CLASSIFY', 'REPORT'];

export async function createQuestionRequest(input: {
  questionId: number;
  type: RequestType;
  title?: string;
  content?: string;
  contentSuggest?: ClassifySuggest | string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: 'Chưa đăng nhập.' };
    if (!VALID_TYPES.includes(input.type)) return { success: false, error: 'Loại yêu cầu không hợp lệ.' };
    if (!input.questionId) return { success: false, error: 'Thiếu câu hỏi.' };

    const contentSuggest =
      typeof input.contentSuggest === 'string'
        ? input.contentSuggest
        : input.contentSuggest
          ? JSON.stringify(input.contentSuggest)
          : null;

    const created = await prisma.lms_requests.create({
      data: {
        question_id: BigInt(input.questionId),
        type: input.type,
        status: 'PENDING',
        title: input.title ?? null,
        content: input.content ?? null,
        content_suggest: contentSuggest,
        created_by_id: BigInt(user.id),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return { success: true, id: Number(created.id) };
  } catch (e: any) {
    console.error('createQuestionRequest:', e?.message);
    return { success: false, error: e?.message || 'Lỗi tạo yêu cầu.' };
  }
}

async function enrichRequests(rows: any[]) {
  const userIds = Array.from(new Set(
    rows.flatMap(r => [r.created_by_id, r.updated_by_id]).filter((v: any): v is bigint => v !== null),
  )).map(Number);
  const users = userIds.length
    ? await prisma.lms_users.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true, nickname: true } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u.nickname || u.username]));

  const qIds = Array.from(new Set(rows.map(r => r.question_id).filter((v: any): v is bigint => v !== null)));
  const questions = qIds.length
    ? await prisma.lms_questions.findMany({ where: { id: { in: qIds } }, select: { id: true, statement: true } })
    : [];
  const qMap = new Map(questions.map(q => [q.id.toString(), q.statement]));

  return rows.map(r => ({
    ...r,
    created_by_name: r.created_by_id ? userMap.get(Number(r.created_by_id)) ?? null : null,
    updated_by_name: r.updated_by_id ? userMap.get(Number(r.updated_by_id)) ?? null : null,
    question_statement: r.question_id ? qMap.get(r.question_id.toString()) ?? null : null,
  }));
}

// PENDING first, then newest.
function statusRank(s: string) {
  return s === 'PENDING' ? 0 : 1;
}

export async function getQuestionRequests(
  filters: { types?: RequestType[]; statuses?: RequestStatus[] } = {},
  page: number = 1,
  pageSize: number = 30,
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { data: [], total: 0, page: 1, pageSize, totalPages: 0 };
    const isAdmin = (user.level_rank ?? 0) >= 5;

    const where: any = {};
    if (!isAdmin) where.created_by_id = BigInt(user.id);
    if (filters.types?.length) where.type = { in: filters.types };
    if (filters.statuses?.length) where.status = { in: filters.statuses };

    const safePage = Math.max(1, Number(page));
    const safeSize = Math.max(1, Number(pageSize));

    const total = await prisma.lms_requests.count({ where });

    const all = await prisma.lms_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
    all.sort((a, b) => {
      const r = statusRank(a.status) - statusRank(b.status);
      if (r !== 0) return r;
      const ta = a.created_at ? a.created_at.getTime() : 0;
      const tb = b.created_at ? b.created_at.getTime() : 0;
      return tb - ta;
    });
    const pageRows = all.slice((safePage - 1) * safeSize, safePage * safeSize);
    const enriched = await enrichRequests(pageRows);

    return serializeBigInt({
      data: enriched,
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages: Math.ceil(total / safeSize),
    });
  } catch (e: any) {
    console.error('getQuestionRequests:', e?.message);
    return { data: [], total: 0, page: 1, pageSize, totalPages: 0 };
  }
}

export async function getRequestsForQuestion(questionId: number) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return [];
    const isAdmin = (user.level_rank ?? 0) >= 5;

    const where: any = { question_id: BigInt(questionId) };
    if (!isAdmin) where.created_by_id = BigInt(user.id);

    const rows = await prisma.lms_requests.findMany({ where, orderBy: { created_at: 'desc' } });
    const enriched = await enrichRequests(rows);
    return serializeBigInt(enriched);
  } catch (e: any) {
    console.error('getRequestsForQuestion:', e?.message);
    return [];
  }
}

export async function cancelQuestionRequest(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: 'Chưa đăng nhập.' };
    const req = await prisma.lms_requests.findUnique({ where: { id: BigInt(id) } });
    if (!req) return { success: false, error: 'Không tìm thấy yêu cầu.' };
    if (Number(req.created_by_id) !== user.id) return { success: false, error: 'Không có quyền hủy.' };
    if (req.status !== 'PENDING') return { success: false, error: 'Chỉ hủy được yêu cầu đang chờ.' };
    await prisma.lms_requests.update({ where: { id: BigInt(id) }, data: { status: 'CANCELLED', updated_at: new Date() } });
    return { success: true };
  } catch (e: any) {
    console.error('cancelQuestionRequest:', e?.message);
    return { success: false, error: e?.message };
  }
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.id) return { ok: false as const, error: 'Chưa đăng nhập.' };
  if ((user.level_rank ?? 0) < 5) return { ok: false as const, error: 'Chỉ admin được thao tác.' };
  return { ok: true as const, userId: user.id };
}

export async function approveQuestionRequest(id: number) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };
    const req = await prisma.lms_requests.findUnique({ where: { id: BigInt(id) } });
    if (!req) return { success: false, error: 'Không tìm thấy yêu cầu.' };
    if (req.status !== 'PENDING') return { success: false, error: 'Yêu cầu đã được xử lý.' };
    await prisma.lms_requests.update({
      where: { id: BigInt(id) },
      data: { status: 'APPROVED', updated_by_id: BigInt(auth.userId), updated_at: new Date() },
    });
    return { success: true };
  } catch (e: any) {
    console.error('approveQuestionRequest:', e?.message);
    return { success: false, error: e?.message };
  }
}

export async function rejectQuestionRequest(id: number, reason: string) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };
    const req = await prisma.lms_requests.findUnique({ where: { id: BigInt(id) } });
    if (!req) return { success: false, error: 'Không tìm thấy yêu cầu.' };
    if (req.status !== 'PENDING') return { success: false, error: 'Yêu cầu đã được xử lý.' };
    await prisma.lms_requests.update({
      where: { id: BigInt(id) },
      data: { status: 'REJECTED', admin_note: reason || null, updated_by_id: BigInt(auth.userId), updated_at: new Date() },
    });
    return { success: true };
  } catch (e: any) {
    console.error('rejectQuestionRequest:', e?.message);
    return { success: false, error: e?.message };
  }
}

export async function getPendingRequestCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return 0;
    const isAdmin = (user.level_rank ?? 0) >= 5;
    const where: any = { status: 'PENDING' };
    if (!isAdmin) where.created_by_id = BigInt(user.id);
    return await prisma.lms_requests.count({ where });
  } catch {
    return 0;
  }
}
