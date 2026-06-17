# Question Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a teacher→admin request workflow (EDIT / CLASSIFY / REPORT) on top of the question bank: teachers submit suggestions on questions they can only view, admins review/apply/reject.

**Architecture:** Reuse the empty `lms_requests` table (add `question_id`, `status`, `admin_note`). New server actions in `src/actions/question-request.ts`. Extend `getAllQuestions` (010) with admin request-priority. New role-aware UI: `QuestionDetailModal` (replaces `QuestionModal` on `/question-list`), `RequestSubmitModal` (teacher), a `/requests` page + `RequestReviewModal` (admin), a header bell badge, and a sidebar link. Applying a suggestion reuses the existing `classifyQuestions` action and `PATCH /api/questions/[id]`.

**Tech Stack:** Next.js 16 App Router (React 19), Prisma (MySQL, relationMode prisma), TypeScript, Tailwind, lucide-react, react-markdown/katex, react-hot-toast.

---

## Testing approach (read first)

No unit-test runner exists (no jest/vitest). Most actions call `getCurrentUser()` (request context) so they can't run from a plain script. Verification per task uses:
- `npx tsc --noEmit` for type/compile correctness (after each code task).
- `npx tsx` DB scripts only where a function is auth-free (none here besides a post-migration column check).
- `npm run build` once at the end.
- Manual `specs/011-question-requests/quickstart.md` with **two accounts** (admin + teacher).

**Do NOT git commit** — leave all work uncommitted (user preference). Skip every commit step.

Reference signatures (already in the codebase, do not change):
- `classifyQuestions(questionIds: number[], { grade?: string|null, lessonId?: string|null, difficulty?: string|null, topicIds?: number[]|null, tagIds?: number[]|null }): Promise<{success, error?}>` — `@/actions/question`.
- `PATCH /api/questions/[id]` body `{ statement?, content?, hint?, options?, question_difficulty?, question_type? }` → returns updated question JSON.
- `AddToCollectionModal({ selectedIds: number[], onClose, onSuccess })` — `@/app/(main)/collection/components/AddToCollectionModal`.
- `TopNavBar({ toggleSidebar, user })` — client; bell at lines 33-36.
- `serializeBigInt` — `@/lib/utils/serialization`; `getCurrentUser` — `@/lib/utils/auth-utils`.

## File structure

```text
prisma/schema.prisma                                   # MODIFY: lms_requests +3 cols +2 indexes
src/actions/question-request.ts                        # NEW: request actions
src/actions/question-list.ts                           # MODIFY: getAllQuestions prioritizeRequests + pendingRequestCount
src/app/(main)/question-list/components/
  ├── RequestSubmitModal.tsx                            # NEW: teacher submit (3 modes)
  ├── QuestionDetailModal.tsx                           # NEW: role-aware detail (replaces QuestionModal here)
  ├── QuestionListTable.tsx                             # MODIFY: use QuestionDetailModal, "N yêu cầu" badge
  └── QuestionListManager.tsx                           # MODIFY: pass prioritizeRequests for admin
src/app/(main)/requests/
  ├── page.tsx                                          # NEW
  └── components/
      ├── RequestsManager.tsx                           # NEW: role-aware list + filters
      ├── RequestList.tsx                               # NEW: list/table
      └── RequestReviewModal.tsx                        # NEW: admin apply/approve/reject
src/components/layout/TopNavBar.tsx                     # MODIFY: bell badge + link /requests
src/components/layout/Sidebar.tsx                       # MODIFY: add "Yêu cầu" link
specs/010-page-list/*                                   # MODIFY: cross-ref notes (spec already noted)
```

Reuse unchanged: `classifyQuestions`, `PATCH /api/questions/[id]`, `AddToCollectionModal`, `QuestionEditModal`, `AppSelect`, `topic-tree-select`, `AppBadge`, math utils.

---

## Task 1: Migration — add fields to `lms_requests`

**Files:**
- Modify: `prisma/schema.prisma` (model `lms_requests`)

- [ ] **Step 1: Edit the Prisma model**

In `prisma/schema.prisma`, replace the `lms_requests` model body's index block and add the three fields so it reads:

```prisma
model lms_requests {
  id              BigInt    @id @default(autoincrement())
  created_at      DateTime?
  updated_at      DateTime?
  created_by_id   BigInt?
  updated_by_id   BigInt?
  title           String?   @db.VarChar(255)
  content         String?   @db.LongText
  type            String?   @db.VarChar(255)
  content_suggest String?   @db.LongText

  // 011-question-requests
  question_id     BigInt?
  status          String    @default("PENDING") @db.VarChar(50)
  admin_note      String?   @db.LongText

  @@index([created_by_id], map: "lms_requests_created_by_id")
  @@index([updated_by_id], map: "lms_requests_updated_by_id")
  @@index([question_id], map: "idx_lms_requests_question_id")
  @@index([status], map: "idx_lms_requests_status")
}
```

- [ ] **Step 2: Create and apply the migration**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank
set -a; . ./.env; set +a
npx prisma migrate dev --name 011_add_question_request_fields
```
Expected: a migration folder `prisma/migrations/<ts>_011_add_question_request_fields/` is created and applied; output "Your database is now in sync".

Fallback if `migrate dev` fails on shadow-DB (common with managed MySQL): run `npx prisma db push` instead, then record the equivalent SQL from `specs/011-question-requests/data-model.md` in a comment at the top of a new file `prisma/migrations/manual_011_add_question_request_fields.sql`. Note which path was used in your task report.

- [ ] **Step 3: Regenerate the client**

Run:
```bash
npx prisma generate
```
Expected: "Generated Prisma Client".

- [ ] **Step 4: Verify columns exist**

Create `scripts/verify-request-columns.ts`:
```ts
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
```
Run:
```bash
set -a; . ./.env; set +a
npx tsx scripts/verify-request-columns.ts
```
Expected: `Found columns: [ 'admin_note', 'question_id', 'status' ]` then `VERIFY OK`.

- [ ] **Step 5: (skip commit)** Leave uncommitted.

---

## Task 2: Server actions `question-request.ts`

**Files:**
- Create: `src/actions/question-request.ts`

- [ ] **Step 1: Create the actions file**

Create `src/actions/question-request.ts`:

```ts
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
  const creatorIds = Array.from(new Set(rows.map(r => r.created_by_id).filter((v: any): v is bigint => v !== null))).map(Number);
  const creators = creatorIds.length
    ? await prisma.lms_users.findMany({ where: { id: { in: creatorIds } }, select: { id: true, username: true, nickname: true } })
    : [];
  const creatorMap = new Map(creators.map(u => [u.id, u.nickname || u.username]));

  const qIds = Array.from(new Set(rows.map(r => r.question_id).filter((v: any): v is bigint => v !== null)));
  const questions = qIds.length
    ? await prisma.lms_questions.findMany({ where: { id: { in: qIds } }, select: { id: true, statement: true } })
    : [];
  const qMap = new Map(questions.map(q => [q.id.toString(), q.statement]));

  return rows.map(r => ({
    ...r,
    created_by_name: r.created_by_id ? creatorMap.get(Number(r.created_by_id)) ?? null : null,
    question_statement: r.question_id ? qMap.get(r.question_id.toString()) ?? null : null,
  }));
}

// PENDING first, then newest. Implemented as two ordered queries because status is a string.
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

    // Fetch all matching ids ordered (PENDING first, created_at desc) in JS — request set is admin-queue sized.
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
```

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit 2>&1 | grep -E "question-request" || echo "NO ERRORS in question-request"
```
Expected: `NO ERRORS in question-request`.

- [ ] **Step 3: (skip commit)**

---

## Task 3: Extend `getAllQuestions` with admin request-priority

**Files:**
- Modify: `src/actions/question-list.ts`

- [ ] **Step 1: Add the options param and request-priority logic**

In `src/actions/question-list.ts`, change the signature to accept an `options` arg:

```ts
export async function getAllQuestions(
  page: number = 1,
  pageSize: number = 50,
  filters: QuestionListFilters = {},
  options: { prioritizeRequests?: boolean } = {}
) {
```

Then, AFTER the block that builds `whereClause` and computes `total` (i.e., after `const total = await prisma.lms_questions.count({ where: whereClause });`), REPLACE the existing single `findMany` call:

```ts
    const questionsRaw = await prisma.lms_questions.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      skip: offset,
      take: safePageSize,
    });
```

with this request-aware version:

```ts
    // Map question_id -> pending request count (only when prioritizing)
    const pendingCountMap = new Map<string, number>();
    let requestedOrdered: bigint[] = [];

    if (options.prioritizeRequests) {
      const grouped = await prisma.lms_requests.groupBy({
        by: ['question_id'],
        where: { status: 'PENDING', question_id: { not: null } },
        _count: { _all: true },
      });
      const reqIds: bigint[] = [];
      for (const g of grouped) {
        if (g.question_id != null) {
          pendingCountMap.set(g.question_id.toString(), g._count._all);
          reqIds.push(g.question_id);
        }
      }
      if (reqIds.length > 0) {
        const requestedRows = await prisma.lms_questions.findMany({
          where: { AND: [whereClause, { id: { in: reqIds } }] },
          select: { id: true },
          orderBy: { id: 'desc' },
        });
        requestedOrdered = requestedRows.map(r => r.id);
      }
    }

    let questionsRaw: any[];
    if (options.prioritizeRequests && requestedOrdered.length > 0) {
      const rCount = requestedOrdered.length;
      const seg1Ids = requestedOrdered.slice(offset, offset + safePageSize);
      let seg1Rows: any[] = [];
      if (seg1Ids.length > 0) {
        const fetched = await prisma.lms_questions.findMany({ where: { id: { in: seg1Ids } } });
        const byId = new Map(fetched.map(q => [q.id.toString(), q]));
        seg1Rows = seg1Ids.map(id => byId.get(id.toString())).filter(Boolean) as any[];
      }
      const remainingTake = safePageSize - seg1Rows.length;
      let seg2Rows: any[] = [];
      if (remainingTake > 0) {
        const seg2Skip = Math.max(0, offset - rCount);
        seg2Rows = await prisma.lms_questions.findMany({
          where: { AND: [whereClause, { id: { notIn: requestedOrdered } }] },
          orderBy: { id: 'desc' },
          skip: seg2Skip,
          take: remainingTake,
        });
      }
      questionsRaw = [...seg1Rows, ...seg2Rows];
    } else {
      questionsRaw = await prisma.lms_questions.findMany({
        where: whereClause,
        orderBy: { id: 'desc' },
        skip: offset,
        take: safePageSize,
      });
    }
```

- [ ] **Step 2: Attach `pendingRequestCount` to each enriched item**

In the enrichment loop, where the `qObj` object is built (the `const qObj: any = { ...q, options, tags, topics, created_by_name, isClassified };` block), add the field:

```ts
        pendingRequestCount: pendingCountMap.get(q.id.toString()) ?? 0,
```

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit 2>&1 | grep -E "question-list" || echo "NO ERRORS in question-list"
```
Expected: `NO ERRORS in question-list`.

- [ ] **Step 4: (skip commit)**

---

## Task 4: `RequestSubmitModal` (teacher submit, 3 modes)

**Files:**
- Create: `src/app/(main)/question-list/components/RequestSubmitModal.tsx`

- [ ] **Step 1: Create the modal**

Create `src/app/(main)/question-list/components/RequestSubmitModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import AppSelect from '@/components/ui/AppSelect';
import TopicTreeSelect from '@/components/ui/topic-tree-select';
import { createQuestionRequest, RequestType, ClassifySuggest } from '@/actions/question-request';

interface Tag { id: number; name: string; category: string }

interface Props {
  question: any;
  mode: RequestType;
  tagsByCategory: Record<string, Tag[]>;
  onClose: () => void;
  onSubmitted: () => void;
}

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TITLES: Record<RequestType, string> = {
  EDIT: 'Đề xuất sửa nội dung',
  CLASSIFY: 'Đề xuất phân loại',
  REPORT: 'Báo lỗi câu hỏi',
};

export default function RequestSubmitModal({ question, mode, tagsByCategory, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState('');
  const [editContent, setEditContent] = useState(question?.statement || '');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSuggest, setReportSuggest] = useState('');
  const [grade, setGrade] = useState<number | null>(question?.grade ? Number(question.grade) : null);
  const [topicIds, setTopicIds] = useState<number[]>((question?.topics || []).map((t: any) => t.topic_id));
  const [tagIds, setTagIds] = useState<number[]>((question?.tags || []).map((t: any) => t.id));
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (id: number) => setTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const submit = async () => {
    setSubmitting(true);
    let payload: { content?: string; contentSuggest?: ClassifySuggest | string };
    if (mode === 'EDIT') {
      payload = { content: reason, contentSuggest: editContent };
    } else if (mode === 'CLASSIFY') {
      payload = { content: reason, contentSuggest: { grade, topicIds, tagIds } };
    } else {
      payload = { content: `Mô tả lỗi: ${reportDesc}\n\nGợi ý: ${reportSuggest}` };
    }
    const res = await createQuestionRequest({ questionId: Number(question.id), type: mode, ...payload });
    setSubmitting(false);
    if (res.success) {
      toast.success('Đã gửi yêu cầu.');
      onSubmitted();
      onClose();
    } else {
      toast.error(res.error || 'Gửi thất bại.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <h2 className="text-lg font-bold text-on-surface font-headline">{TITLES[mode]} (Q-{question.id})</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {mode === 'EDIT' && (
            <>
              <label className="text-xs font-bold uppercase text-outline">Nội dung đề xuất mới</label>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={6}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
              <label className="text-xs font-bold uppercase text-outline">Lý do</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
            </>
          )}

          {mode === 'CLASSIFY' && (
            <>
              <label className="text-xs font-bold uppercase text-outline">Khối lớp</label>
              <div className="w-[160px]">
                <AppSelect value={grade ?? ''} onChange={e => setGrade(e.target.value ? Number(e.target.value) : null)} placeholder="Khối lớp">
                  <option value="">— Chọn —</option>
                  {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </AppSelect>
              </div>
              <label className="text-xs font-bold uppercase text-outline">Chủ đề</label>
              <TopicTreeSelect multiple value={topicIds.map(String)} onChange={v => setTopicIds(Array.isArray(v) ? v.map(Number) : [])} placeholder="Chọn chủ đề..." />
              <label className="text-xs font-bold uppercase text-outline">Tags</label>
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto">
                {Object.entries(tagsByCategory).filter(([, l]) => l.length > 0).map(([cat, list]) => (
                  <div key={cat} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase text-outline">{cat}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map(tag => (
                        <button key={tag.id} onClick={() => toggleTag(tag.id)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${tagIds.includes(tag.id) ? 'bg-primary/10 border-primary/40 text-primary' : 'border-outline-variant/30 text-on-surface-variant'}`}>
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <label className="text-xs font-bold uppercase text-outline">Ghi chú</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
            </>
          )}

          {mode === 'REPORT' && (
            <>
              <label className="text-xs font-bold uppercase text-outline">Mô tả lỗi</label>
              <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} rows={4}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
              <label className="text-xs font-bold uppercase text-outline">Gợi ý sửa</label>
              <textarea value={reportSuggest} onChange={e => setReportSuggest(e.target.value)} rows={3}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
            </>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-container-low">Hủy</button>
          <button onClick={submit} disabled={submitting}
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit 2>&1 | grep -E "RequestSubmitModal" || echo "NO ERRORS in RequestSubmitModal"
```
Expected: `NO ERRORS in RequestSubmitModal`.

- [ ] **Step 3: (skip commit)**

---

## Task 5: `QuestionDetailModal` (role-aware) + wire into table

**Files:**
- Create: `src/app/(main)/question-list/components/QuestionDetailModal.tsx`
- Modify: `src/app/(main)/question-list/components/QuestionListTable.tsx`

- [ ] **Step 1: Create the detail modal**

Create `src/app/(main)/question-list/components/QuestionDetailModal.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Pencil, Tags, Flag, FolderPlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import { cleanMathpixData, getQuestionDisplayContent } from '@/lib/utils/math-utils';
import { RequestType } from '@/actions/question-request';
import { getRequestsForQuestion, cancelQuestionRequest } from '@/actions/question-request';
import RequestSubmitModal from './RequestSubmitModal';
import AddToCollectionModal from '@/app/(main)/collection/components/AddToCollectionModal';

interface Tag { id: number; name: string; category: string }

interface Props {
  question: any;
  isAdmin: boolean;
  currentUserId: number | null;
  tagsByCategory: Record<string, Tag[]>;
  onClose: () => void;
  onReview?: (question: any) => void; // admin: open RequestReviewModal for a request
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { text: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { text: 'Từ chối', cls: 'bg-rose-100 text-rose-700' },
  CANCELLED: { text: 'Đã hủy', cls: 'bg-slate-100 text-slate-600' },
};
const TYPE_LABEL: Record<string, string> = { EDIT: 'Đề xuất sửa', CLASSIFY: 'Đề xuất phân loại', REPORT: 'Báo lỗi' };

export default function QuestionDetailModal({ question, isAdmin, currentUserId, tagsByCategory, onClose, onReview }: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  const [submitMode, setSubmitMode] = useState<RequestType | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    const r = await getRequestsForQuestion(Number(question.id));
    setRequests(r || []);
  }, [question.id]);

  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const onCancel = async (id: number) => {
    const res = await cancelQuestionRequest(id);
    if (res.success) { toast.success('Đã hủy yêu cầu.'); loadRequests(); }
    else toast.error(res.error || 'Hủy thất bại.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <div>
            <h2 className="text-lg font-bold text-on-surface font-headline">Chi tiết câu hỏi (Q-{question.id})</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">{question.question_type || '—'}</span>
              <span className="px-2 py-0.5 rounded bg-outline-variant/10 text-outline-variant text-[10px] font-bold uppercase">{question.grade ? `Lớp ${question.grade}` : '—'}</span>
              <span className="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">{question.question_difficulty || '—'}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 text-on-surface">
          <div className="prose prose-slate max-w-none text-base [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-4 mb-6">
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}>
              {cleanMathpixData(getQuestionDisplayContent(question.statement, question.content))}
            </ReactMarkdown>
          </div>

          {question.options && question.options.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {[...question.options].sort((a: any, b: any) => a.order - b.order).map((opt: any) => {
                const correct = opt.weight === 1;
                const label = String.fromCharCode(65 + (opt.order - 1));
                return (
                  <div key={opt.id} className={`flex gap-3 p-3 rounded-xl border-2 ${correct ? 'bg-green-50 border-green-500/50' : 'bg-surface-container-low border-outline-variant/20'}`}>
                    <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border-2 ${correct ? 'bg-green-100 text-green-700 border-green-500/50' : 'bg-white text-outline border-outline-variant/30'}`}>{label}</div>
                    <div className="pt-0.5 prose prose-slate max-w-none text-sm">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: 'ignore' }], rehypeRaw]}>{cleanMathpixData(opt.content)}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Requests on this question */}
          <div className="mt-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-outline mb-3">{isAdmin ? 'Yêu cầu của câu hỏi' : 'Yêu cầu của tôi'}</h3>
            {requests.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Chưa có yêu cầu nào.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {requests.map(r => {
                  const st = STATUS_LABEL[r.status] || STATUS_LABEL.PENDING;
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{TYPE_LABEL[r.type] || r.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.text}</span>
                      <span className="text-xs text-on-surface-variant truncate flex-1">{r.content || ''}</span>
                      {isAdmin && r.status === 'PENDING' && onReview && (
                        <button onClick={() => onReview(r)} className="px-2.5 py-1 rounded-lg border border-primary/40 text-primary text-xs font-bold">Xử lý</button>
                      )}
                      {!isAdmin && r.status === 'PENDING' && Number(r.created_by_id) === currentUserId && (
                        <button onClick={() => onCancel(Number(r.id))} className="px-2.5 py-1 rounded-lg border border-outline-variant/30 text-xs font-bold hover:text-error">Hủy</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-outline-variant/20 flex flex-wrap justify-end gap-2">
          {!isAdmin && (
            <>
              <button onClick={() => setSubmitMode('EDIT')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:border-primary/40"><Pencil className="w-4 h-4" /> Đề xuất sửa</button>
              <button onClick={() => setSubmitMode('CLASSIFY')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:border-primary/40"><Tags className="w-4 h-4" /> Đề xuất phân loại</button>
              <button onClick={() => setSubmitMode('REPORT')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:border-error/40"><Flag className="w-4 h-4" /> Báo lỗi</button>
            </>
          )}
          <button onClick={() => setCollectionOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-bold hover:border-primary/40"><FolderPlus className="w-4 h-4" /> Thêm vào collection</button>
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-bold hover:bg-surface-container-low">Đóng</button>
        </div>
      </div>

      {submitMode && (
        <RequestSubmitModal question={question} mode={submitMode} tagsByCategory={tagsByCategory}
          onClose={() => setSubmitMode(null)} onSubmitted={loadRequests} />
      )}
      {collectionOpen && (
        <AddToCollectionModal selectedIds={[Number(question.id)]} onClose={() => setCollectionOpen(false)} onSuccess={() => { toast.success('Đã thêm vào collection.'); setCollectionOpen(false); }} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `QuestionListTable` (replace `QuestionModal`)**

In `src/app/(main)/question-list/components/QuestionListTable.tsx`:

1. Replace the import line `import QuestionModal from '@/app/(main)/question-bank/components/QuestionModal';` with:
```tsx
import QuestionDetailModal from './QuestionDetailModal';
```

2. Add `tagsByCategory` to the `Props` interface:
```tsx
  tagsByCategory: Record<string, { id: number; name: string; category: string }[]>;
```
and to the destructured params: add `tagsByCategory,`.

3. Replace the modal render at the bottom:
```tsx
      {selected && (
        <QuestionModal
          question={selected}
          onClose={() => setSelected(null)}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          showEditButton={false}
        />
      )}
```
with:
```tsx
      {selected && (
        <QuestionDetailModal
          question={selected}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          tagsByCategory={tagsByCategory}
          onClose={() => setSelected(null)}
        />
      )}
```

4. Add a "N yêu cầu" badge in the "Phân loại" cell (or a new small badge next to the status). In the status cell, after the classified badge, add:
```tsx
                  {q.pendingRequestCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{q.pendingRequestCount} yêu cầu</span>
                  )}
```

- [ ] **Step 3: Pass `tagsByCategory` down from the manager**

In `src/app/(main)/question-list/components/QuestionListManager.tsx`, the `<QuestionListTable .../>` render: add the prop `tagsByCategory={tagsByCategory}` (the manager already receives `tagsByCategory` in its props).

- [ ] **Step 4: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit 2>&1 | grep -E "question-list|QuestionDetailModal" || echo "NO ERRORS"
```
Expected: `NO ERRORS`.

- [ ] **Step 5: (skip commit)**

---

## Task 6: Enable admin request-priority on `/question-list`

**Files:**
- Modify: `src/app/(main)/question-list/components/QuestionListManager.tsx`

- [ ] **Step 1: Pass `prioritizeRequests` when admin**

In the fetch effect in `QuestionListManager.tsx`, change the `getAllQuestions(...)` call to pass the options arg:

```ts
    getAllQuestions(page, PAGE_SIZE, {
      grades, questionTypes, topicIds, tagIds, keyword: debouncedKeyword, unclassified,
    }, { prioritizeRequests: isAdmin }).then(res => {
```

(The component already receives `isAdmin` in props.)

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit 2>&1 | grep -E "QuestionListManager" || echo "NO ERRORS in QuestionListManager"
```
Expected: `NO ERRORS in QuestionListManager`.

- [ ] **Step 3: (skip commit)**

---

## Task 7: `RequestReviewModal` (admin apply/approve/reject)

**Files:**
- Create: `src/app/(main)/requests/components/RequestReviewModal.tsx`

- [ ] **Step 1: Create the review modal**

Create `src/app/(main)/requests/components/RequestReviewModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { classifyQuestions } from '@/actions/question';
import { approveQuestionRequest, rejectQuestionRequest } from '@/actions/question-request';

interface Props {
  request: any; // RequestListItem
  onClose: () => void;
  onDone: () => void;
}

function parseClassify(raw: string | null): { grade: number | null; topicIds: number[]; tagIds: number[] } | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    return { grade: o.grade ?? null, topicIds: o.topicIds ?? [], tagIds: o.tagIds ?? [] };
  } catch { return null; }
}

export default function RequestReviewModal({ request, onClose, onDone }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const classify = parseClassify(request.content_suggest);
  const isPending = request.status === 'PENDING';

  const applyClassify = async () => {
    if (!classify || !request.question_id) { toast.error('Đề xuất phân loại không hợp lệ.'); return; }
    setBusy(true);
    const res = await classifyQuestions([Number(request.question_id)], {
      grade: classify.grade != null ? String(classify.grade) : null,
      topicIds: classify.topicIds,
      tagIds: classify.tagIds,
    });
    if (!res.success) { setBusy(false); toast.error(res.error || 'Áp dụng thất bại.'); return; }
    const ap = await approveQuestionRequest(Number(request.id));
    setBusy(false);
    if (ap.success) { toast.success('Đã áp dụng & duyệt.'); onDone(); onClose(); }
    else toast.error(ap.error || 'Duyệt thất bại.');
  };

  const applyEdit = async () => {
    if (!request.question_id) return;
    setBusy(true);
    const resp = await fetch(`/api/questions/${request.question_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statement: request.content_suggest || '' }),
    });
    if (!resp.ok) { setBusy(false); toast.error('Áp dụng sửa thất bại.'); return; }
    const ap = await approveQuestionRequest(Number(request.id));
    setBusy(false);
    if (ap.success) { toast.success('Đã áp dụng & duyệt.'); onDone(); onClose(); }
    else toast.error(ap.error || 'Duyệt thất bại.');
  };

  const markHandled = async () => {
    setBusy(true);
    const ap = await approveQuestionRequest(Number(request.id));
    setBusy(false);
    if (ap.success) { toast.success('Đã đánh dấu xử lý.'); onDone(); onClose(); }
    else toast.error(ap.error || 'Thất bại.');
  };

  const doReject = async () => {
    setBusy(true);
    const r = await rejectQuestionRequest(Number(request.id), reason);
    setBusy(false);
    if (r.success) { toast.success('Đã từ chối.'); onDone(); onClose(); }
    else toast.error(r.error || 'Thất bại.');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <h2 className="text-lg font-bold font-headline">Xử lý yêu cầu #{request.id} · {request.type}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3 text-sm">
          <div><span className="font-bold text-outline">Câu hỏi: </span>{request.question_statement ? `Q-${request.question_id}: ${request.question_statement.slice(0, 160)}` : 'Câu hỏi không tồn tại'}</div>
          <div><span className="font-bold text-outline">Người gửi: </span>{request.created_by_name || '—'}</div>
          {request.content && <div className="p-3 rounded-xl bg-surface-container-low whitespace-pre-wrap"><span className="font-bold text-outline">Nội dung: </span>{request.content}</div>}
          {request.type === 'CLASSIFY' && (
            <div className="p-3 rounded-xl bg-surface-container-low">
              <span className="font-bold text-outline">Phân loại đề xuất: </span>
              {classify ? `Khối ${classify.grade ?? '—'} · ${classify.topicIds.length} chủ đề · ${classify.tagIds.length} tag` : 'Không hợp lệ'}
            </div>
          )}
          {request.type === 'EDIT' && request.content_suggest && (
            <div className="p-3 rounded-xl bg-surface-container-low whitespace-pre-wrap"><span className="font-bold text-outline">Nội dung mới: </span>{request.content_suggest}</div>
          )}
          {request.admin_note && <div className="p-3 rounded-xl bg-rose-50 text-rose-700"><span className="font-bold">Lý do từ chối: </span>{request.admin_note}</div>}

          {rejecting && (
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Lý do từ chối..."
              className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20 flex flex-wrap justify-end gap-2">
          {!isPending && <span className="text-sm text-on-surface-variant self-center">Yêu cầu đã được xử lý ({request.status}).</span>}
          {isPending && !rejecting && (
            <>
              {request.type === 'CLASSIFY' && <button onClick={applyClassify} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Áp dụng & duyệt</button>}
              {request.type === 'EDIT' && <button onClick={applyEdit} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Áp dụng & duyệt</button>}
              {request.type === 'REPORT' && <button onClick={markHandled} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">Đánh dấu đã xử lý</button>}
              <button onClick={() => setRejecting(true)} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-bold border border-error/40 text-error">Từ chối</button>
            </>
          )}
          {isPending && rejecting && (
            <>
              <button onClick={() => setRejecting(false)} className="px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface-container-low">Quay lại</button>
              <button onClick={doReject} disabled={busy || !reason.trim()} className="px-4 py-2 rounded-lg text-sm font-bold bg-error text-white disabled:opacity-50">Xác nhận từ chối</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

> Note: applying EDIT here updates only `statement` from the teacher's free-text suggestion (per the spec's EDIT data shape). The admin can do finer edits via `QuestionEditModal` on `/question-list` if needed.

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit 2>&1 | grep -E "RequestReviewModal" || echo "NO ERRORS in RequestReviewModal"
```
Expected: `NO ERRORS in RequestReviewModal`.

- [ ] **Step 3: (skip commit)**

---

## Task 8: `/requests` page (role-aware)

**Files:**
- Create: `src/app/(main)/requests/page.tsx`
- Create: `src/app/(main)/requests/components/RequestsManager.tsx`
- Create: `src/app/(main)/requests/components/RequestList.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(main)/requests/page.tsx`:

```tsx
export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/utils/auth-utils';
import RequestsManager from './components/RequestsManager';

export default async function RequestsPage() {
  const user = await getCurrentUser();
  const isAdmin = (user?.level_rank ?? 0) >= 5;
  const currentUserId = user?.id ?? null;

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface font-headline">{isAdmin ? 'Hộp thư yêu cầu' : 'Yêu cầu của tôi'}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{isAdmin ? 'Duyệt/từ chối các đề xuất từ giáo viên.' : 'Theo dõi và hủy các yêu cầu bạn đã gửi.'}</p>
      </div>
      <RequestsManager isAdmin={isAdmin} currentUserId={currentUserId} />
    </div>
  );
}
```

- [ ] **Step 2: Create the manager**

Create `src/app/(main)/requests/components/RequestsManager.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getQuestionRequests, cancelQuestionRequest, RequestType, RequestStatus } from '@/actions/question-request';
import RequestList from './RequestList';
import RequestReviewModal from './RequestReviewModal';

interface Props { isAdmin: boolean; currentUserId: number | null }

const TYPES: RequestType[] = ['EDIT', 'CLASSIFY', 'REPORT'];
const STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const PAGE_SIZE = 30;

export default function RequestsManager({ isAdmin, currentUserId }: Props) {
  const [types, setTypes] = useState<RequestType[]>([]);
  const [statuses, setStatuses] = useState<RequestStatus[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getQuestionRequests({ types, statuses }, page, PAGE_SIZE);
    setData(res.data || []);
    setTotal(res.total || 0);
    setTotalPages(res.totalPages || 0);
    setLoading(false);
  }, [types, statuses, page]);

  useEffect(() => { load(); }, [load]);

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => { set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]); setPage(1); };

  const onCancel = async (id: number) => {
    const r = await cancelQuestionRequest(id);
    if (r.success) { toast.success('Đã hủy.'); load(); } else toast.error(r.error || 'Thất bại.');
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex flex-wrap gap-2 items-center">
        {TYPES.map(t => (
          <button key={t} onClick={() => toggle(types, t, setTypes)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${types.includes(t) ? 'bg-primary/10 border-primary/40 text-primary' : 'border-outline-variant/30'}`}>{t}</button>
        ))}
        <span className="mx-2 text-outline">|</span>
        {STATUSES.map(s => (
          <button key={s} onClick={() => toggle(statuses, s, setStatuses)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${statuses.includes(s) ? 'bg-primary/10 border-primary/40 text-primary' : 'border-outline-variant/30'}`}>{s}</button>
        ))}
      </div>

      <RequestList
        rows={data}
        loading={loading}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        onReview={setReviewing}
        onCancel={onCancel}
      />

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-on-surface-variant font-semibold">Tổng {total} · Trang {page}/{Math.max(1, totalPages)}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40">Trước</button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40">Sau</button>
        </div>
      </div>

      {reviewing && <RequestReviewModal request={reviewing} onClose={() => setReviewing(null)} onDone={load} />}
    </div>
  );
}
```

- [ ] **Step 3: Create the list**

Create `src/app/(main)/requests/components/RequestList.tsx`:

```tsx
'use client';

interface Props {
  rows: any[];
  loading: boolean;
  isAdmin: boolean;
  currentUserId: number | null;
  onReview: (r: any) => void;
  onCancel: (id: number) => void;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { text: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { text: 'Từ chối', cls: 'bg-rose-100 text-rose-700' },
  CANCELLED: { text: 'Đã hủy', cls: 'bg-slate-100 text-slate-600' },
};
const TYPE_LABEL: Record<string, string> = { EDIT: 'Đề xuất sửa', CLASSIFY: 'Phân loại', REPORT: 'Báo lỗi' };

export default function RequestList({ rows, loading, isAdmin, currentUserId, onReview, onCancel }: Props) {
  if (loading) return <div className="py-10 text-center text-on-surface-variant">Đang tải...</div>;
  if (rows.length === 0) return <div className="py-10 text-center text-on-surface-variant">Chưa có yêu cầu nào.</div>;

  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-outline-variant/20">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-surface-container-low">
          <tr className="text-left text-xs uppercase tracking-wider text-outline">
            <th className="px-3 py-3 font-extrabold">Loại</th>
            <th className="px-3 py-3 font-extrabold">Trạng thái</th>
            <th className="px-3 py-3 font-extrabold min-w-[280px]">Câu hỏi</th>
            <th className="px-3 py-3 font-extrabold">Nội dung</th>
            {isAdmin && <th className="px-3 py-3 font-extrabold">Người gửi</th>}
            <th className="px-3 py-3 font-extrabold text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const st = STATUS_LABEL[r.status] || STATUS_LABEL.PENDING;
            return (
              <tr key={r.id} className="border-t border-outline-variant/10 align-top hover:bg-surface-container-low/40">
                <td className="px-3 py-3"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{TYPE_LABEL[r.type] || r.type}</span></td>
                <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.text}</span></td>
                <td className="px-3 py-3 text-on-surface">{r.question_statement ? `Q-${r.question_id}: ${String(r.question_statement).slice(0, 90)}` : <span className="text-outline italic">Câu hỏi không tồn tại</span>}</td>
                <td className="px-3 py-3 text-on-surface-variant">{(r.content || '').slice(0, 80)}</td>
                {isAdmin && <td className="px-3 py-3 whitespace-nowrap text-xs">{r.created_by_name || '—'}</td>}
                <td className="px-3 py-3 text-right">
                  {isAdmin
                    ? <button onClick={() => onReview(r)} className="px-2.5 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-bold">Xử lý</button>
                    : (r.status === 'PENDING' && Number(r.created_by_id) === currentUserId
                        ? <button onClick={() => onCancel(Number(r.id))} className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold hover:text-error">Hủy</button>
                        : <span className="text-xs text-outline">—</span>)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit 2>&1 | grep -E "requests/" || echo "NO ERRORS in requests page"
```
Expected: `NO ERRORS in requests page`.

- [ ] **Step 5: (skip commit)**

---

## Task 9: Header bell badge + sidebar link

**Files:**
- Modify: `src/components/layout/TopNavBar.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: TopNavBar bell → badge + link**

In `src/components/layout/TopNavBar.tsx`:

1. Update imports/top:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/utils/auth-utils';
import { getPendingRequestCount } from '@/actions/question-request';
```

2. Inside the component body (before `return`):
```tsx
  const router = useRouter();
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let active = true;
    getPendingRequestCount().then(n => { if (active) setPending(n); });
    return () => { active = false; };
  }, []);
```

3. Replace the bell button (the `<button onClick={() => window.alert('Chức năng đang cập nhật!')} ...>` containing `notifications`) with:
```tsx
          <button onClick={() => router.push('/requests')} className="p-2 rounded-full cursor-pointer hover:bg-surface-container-high transition-colors text-on-surface-variant relative" title="Yêu cầu">
            <span className="material-symbols-outlined">notifications</span>
            {pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {pending > 99 ? '99+' : pending}
              </span>
            )}
          </button>
```

- [ ] **Step 2: Sidebar link**

In `src/components/layout/Sidebar.tsx`:
1. Add `Inbox` to the `lucide-react` import.
2. Add a nav item after the "Question Bank" entry:
```tsx
    { icon: Inbox, label: 'Yêu cầu', href: '/requests' },
```

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit 2>&1 | grep -E "TopNavBar|Sidebar" || echo "NO ERRORS in layout"
```
Expected: `NO ERRORS in layout`.

- [ ] **Step 4: (skip commit)**

---

## Task 10: Cross-ref 010, build & manual verification

**Files:**
- Modify: `specs/010-page-list/data-model.md`, `specs/010-page-list/tasks.md` (spec.md already noted)

- [ ] **Step 1: Add cross-ref notes to 010 supporting docs**

Append to `specs/010-page-list/data-model.md` (end of file):
```markdown

## Cập nhật bởi 011-question-requests
- `getAllQuestions` thêm tham số `options.prioritizeRequests` và trả `pendingRequestCount` mỗi item (đẩy câu có request PENDING lên đầu cho admin). Chi tiết: `specs/011-question-requests/data-model.md` mục 5.
- Modal "Xem chi tiết" đổi từ `QuestionModal` sang `QuestionDetailModal` (role-aware).
```
Append to `specs/010-page-list/tasks.md` (end of file):
```markdown

## Cập nhật bởi 011-question-requests
- T7 (`QuestionListTable`): dùng `QuestionDetailModal` thay `QuestionModal`; thêm badge "N yêu cầu".
- `getAllQuestions`: mở rộng `prioritizeRequests` + `pendingRequestCount`.
```

- [ ] **Step 2: Build**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank
set -a; . ./.env; set +a
npm run build 2>&1 | tail -30
```
Expected: build succeeds; `/requests` appears in the route list; no errors from new files.

- [ ] **Step 3: Manual verification (two accounts)**

Run `npm run dev` and walk through `specs/011-question-requests/quickstart.md`:
- Teacher: submit EDIT/CLASSIFY/REPORT from `QuestionDetailModal`; see own requests + cancel; bell badge = own PENDING; `/requests` shows only own.
- Admin: `/requests` lists all, PENDING first, filters work; apply+approve CLASSIFY/EDIT (verify the question actually changed); reject with reason; processed requests lock; `/question-list` floats requested questions to top with "N yêu cầu" badge; bell badge = all PENDING.

- [ ] **Step 4: Regression**

- `/question-bank` still uses the old `QuestionModal` and works.
- Non-admin `/question-list` ordering/pagination unchanged (no prioritization).

- [ ] **Step 5: Remove throwaway script (optional)**

```bash
rm scripts/verify-request-columns.ts
```
(Keep if useful. No commit.)

---

## Self-review notes (spec coverage)

- FR-001 → Task 1. FR-002/003/004 → Task 2 (create) + data shapes in Tasks 4/7. FR-005 → Task 2 `createQuestionRequest`. FR-006 → Task 2 `cancelQuestionRequest`. FR-007/008 → Task 2 approve/reject. FR-009 → Task 7 (reuse `classifyQuestions` + `PATCH`). FR-010 → Task 2 `getQuestionRequests` + Task 8. FR-011 → Task 2 `getRequestsForQuestion` + Task 5. FR-012 → Task 2 `getPendingRequestCount` + Task 9. FR-013 → Task 8. FR-014 → Task 5. FR-015 → Task 4. FR-016 → Task 3 + Task 6. FR-017 → Task 9 (TopNavBar). FR-018 → Task 9 (Sidebar, no badge there). FR-019 → Task 2 (`requireAdmin`, owner checks).
- Type consistency: `RequestType`/`RequestStatus`/`ClassifySuggest` defined in Task 2, imported by Tasks 4/5/7/8. `getAllQuestions` items gain `pendingRequestCount` (Task 3) consumed in Task 5 badge.
- Migration documented in `specs/011-question-requests/data-model.md` (Migration log) per user requirement; Task 1 references it.
```
