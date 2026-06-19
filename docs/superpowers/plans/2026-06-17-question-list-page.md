# Question List Page (`/question-list`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new `/question-list` page (a child of the "Xử lý tài liệu" sidebar group) that lists all questions in the database (excluding private per role rules), paginated 50/page, with a horizontal filter header and a read-only table.

**Architecture:** A new Server Action `getAllQuestions` (in its own file `src/actions/question-list.ts`) scans `lms_questions` directly — no join through documents. Topic-recursion and tag-intersection logic is extracted into a shared, auth-free helper `src/lib/services/question-filters.ts`. The UI follows "Hướng 1": new components (`QuestionListManager`, `QuestionListFilterHeader`, `QuestionListTable`) that reuse existing shared primitives (`AppSelect`, `TopicTreeSelect`, `AppBadge`, `QuestionModal`). No database migration — read-only. The existing `getLibraryQuestions` and `/question-bank` page are NOT modified.

**Tech Stack:** Next.js 16 App Router (React 19), Prisma ORM (MySQL), TypeScript, Tailwind CSS, lucide-react, react-markdown/katex.

---

## Testing approach (read first)

This project has **no unit-test runner** (no jest/vitest in `package.json`). Verification adapts to available tooling:

- **Pure DB helpers** (`question-filters.ts`) — verified by a standalone `tsx` script run against the dev database (`npx tsx scripts/<name>.ts`). These functions take no auth context, so they are directly callable. This is the closest thing to an automated "test" and is REQUIRED for Task 1.
- **`getAllQuestions`** — calls `getCurrentUser()` which needs a request context, so it cannot run from a plain script. It is verified via (a) `npm run build` for type/compile correctness and (b) manual UI checks in the quickstart (Task 8), including role-based visibility on two accounts.
- **UI** — verified manually in the browser per `specs/010-page-list/quickstart.md`.

Commit after each task. Branch: `010-page-list`.

## File structure

```text
src/
├── lib/services/
│   └── question-filters.ts             # NEW: resolveTopicQuestionIds, getQuestionIdsByTags, getClassifiedQuestionIds
├── actions/
│   └── question-list.ts                # NEW: getAllQuestions
├── components/layout/
│   └── Sidebar.tsx                     # MODIFY: add "Danh sách câu hỏi" child + auto-open condition
└── app/(main)/question-list/
    ├── page.tsx                        # NEW: server component, loads difficulties + isAdmin + currentUserId
    └── components/
        ├── QuestionListManager.tsx     # NEW: client, filter+page state, URL sync, calls getAllQuestions
        ├── QuestionListFilterHeader.tsx# NEW: horizontal filter header
        └── QuestionListTable.tsx       # NEW: read-only table + pagination + QuestionModal

scripts/
└── verify-question-filters.ts          # NEW: tsx verification for Task 1 (can be deleted after)
```

Reused without modification: `@/components/ui/AppSelect`, `@/components/ui/topic-tree-select`, `@/components/ui/AppBadge`, `@/app/(main)/question-bank/components/QuestionModal`, `@/lib/utils/serialization` (`serializeBigInt`), `@/lib/utils/auth-utils` (`getCurrentUser`), `@/lib/utils/math-utils` (`getQuestionDisplayContent`, `cleanMathpixData`), `@/actions/difficulty` (`Difficulty` type).

---

## Task 1: Shared filter helper `question-filters.ts`

**Files:**
- Create: `src/lib/services/question-filters.ts`
- Verify: `scripts/verify-question-filters.ts`

- [ ] **Step 1: Create the helper module**

Create `src/lib/services/question-filters.ts`:

```ts
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

  let result: Set<string> | null = null;
  for (const ids of Object.values(tagsByCategory)) {
    const rels = await prisma.lms_questions_tags.findMany({
      where: { tag_id: { in: ids } },
      select: { question_id: true },
    });
    const set = new Set(rels.map(r => r.question_id.toString()));
    result = result === null ? set : new Set([...result].filter(x => set.has(x)));
  }

  return result ? Array.from(result).map(s => BigInt(s)) : [];
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
```

- [ ] **Step 2: Write the verification script**

Create `scripts/verify-question-filters.ts`:

```ts
import { resolveTopicQuestionIds, getQuestionIdsByTags, getClassifiedQuestionIds } from '@/lib/services/question-filters';
import { prisma } from '@/lib/db';

async function main() {
  // 1. Empty inputs return []
  console.assert((await resolveTopicQuestionIds([])).length === 0, 'topic [] should be empty');
  console.assert((await getQuestionIdsByTags([])).length === 0, 'tags [] should be empty');

  // 2. Topic recursion: pick a topic that HAS a path, expect ids ⊇ direct links
  const topic = await prisma.lms_topics.findFirst({ where: { path: { not: null } }, select: { id: true } });
  if (topic) {
    const ids = await resolveTopicQuestionIds([Number(topic.id)]);
    console.log(`resolveTopicQuestionIds(${topic.id}) -> ${ids.length} question ids`);
  } else {
    console.log('No topic with path found — skipping recursion check');
  }

  // 3. Tag intersection: pick two tags in DIFFERENT categories, AND must be subset of each OR-set
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

  // 4. Classified set is non-negative and consistent
  const classified = await getClassifiedQuestionIds();
  console.log(`classified (has topic AND tag) -> ${classified.length} ids`);

  console.log('VERIFY OK');
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('VERIFY FAILED', e); await prisma.$disconnect(); process.exit(1); });
```

- [ ] **Step 3: Run the verification script and confirm it passes**

Run (loads `.env` for `DATABASE_URL`):
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank
set -a; . ./.env; set +a
npx tsx scripts/verify-question-filters.ts
```
Expected: prints counts for each section and ends with `VERIFY OK`, no `VERIFY FAILED`, no assertion warnings.

> Note: `tsx` resolves the `@/` alias via `tsconfig.json` `paths`. If `@/` does not resolve under tsx, change the script imports to relative paths (`../src/lib/services/question-filters`, `../src/lib/db`) and re-run.

- [ ] **Step 4: Commit**

```bash
git add src/lib/services/question-filters.ts scripts/verify-question-filters.ts
git commit -m "feat(question-list): add shared question filter helpers"
```

---

## Task 2: Server Action `getAllQuestions`

**Files:**
- Create: `src/actions/question-list.ts`

- [ ] **Step 1: Create the action file**

Create `src/actions/question-list.ts`:

```ts
'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/utils/auth-utils';
import { serializeBigInt } from '@/lib/utils/serialization';
import {
  resolveTopicQuestionIds,
  getQuestionIdsByTags,
  getClassifiedQuestionIds,
} from '@/lib/services/question-filters';

export interface QuestionListFilters {
  grades?: number[];
  questionTypes?: string[];
  topicIds?: number[];
  tagIds?: number[];
  keyword?: string;
  unclassified?: boolean;
}

export async function getAllQuestions(
  page: number = 1,
  pageSize: number = 50,
  filters: QuestionListFilters = {}
) {
  const {
    grades = [],
    questionTypes = [],
    topicIds = [],
    tagIds = [],
    keyword = '',
    unclassified = false,
  } = filters;

  try {
    const user = await getCurrentUser();
    const userId = user?.id ?? null;
    const isAdmin = (user?.level_rank ?? 0) >= 5;

    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Number(pageSize));
    const offset = (safePage - 1) * safePageSize;

    const whereClause: any = { AND: [] };

    // 1. Visibility / phân quyền
    if (!isAdmin) {
      const orVisibility: any[] = [{ public: '1' }, { public: null }];
      if (userId !== null) {
        orVisibility.push(
          { created_by_id: BigInt(userId) },
          { owned_by_id: BigInt(userId) },
          { teacher_owned_by_id: BigInt(userId) },
        );
      }
      whereClause.AND.push({ OR: orVisibility });
    }
    // Admin: không thêm điều kiện public → thấy cả private ('0').

    // 2. Ẩn câu con chùm 'sub'
    whereClause.AND.push({ OR: [{ complex: { not: 'sub' } }, { complex: null }] });

    // 3. Lọc grade / question_type / keyword
    if (grades.length > 0) whereClause.grade = { in: grades.map(Number) };
    if (questionTypes.length > 0) whereClause.question_type = { in: questionTypes };
    if (keyword) {
      whereClause.AND.push({
        OR: [{ statement: { contains: keyword } }, { content: { contains: keyword } }],
      });
    }

    // 4. Ràng buộc theo tập id (topic + tag), giao nhau nếu cả hai
    let idConstraint: bigint[] | null = null;
    if (topicIds.length > 0) {
      idConstraint = await resolveTopicQuestionIds(topicIds);
    }
    if (tagIds.length > 0) {
      const tagMatch = await getQuestionIdsByTags(tagIds);
      if (idConstraint === null) {
        idConstraint = tagMatch;
      } else {
        const tagSet = new Set(tagMatch.map(String));
        idConstraint = idConstraint.filter(id => tagSet.has(id.toString()));
      }
    }

    // 5. Bộ lọc "chưa phân loại" → notIn tập đã đủ topic + tag
    let notInIds: bigint[] | null = null;
    if (unclassified) {
      notInIds = await getClassifiedQuestionIds();
    }

    const idFilter: any = {};
    if (idConstraint !== null) idFilter.in = idConstraint;
    if (notInIds !== null) idFilter.notIn = notInIds;
    if (Object.keys(idFilter).length > 0) whereClause.id = idFilter;

    if (whereClause.AND.length === 0) delete whereClause.AND;

    // 6. Đếm + phân trang
    const total = await prisma.lms_questions.count({ where: whereClause });

    const questionsRaw = await prisma.lms_questions.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      skip: offset,
      take: safePageSize,
    });

    const pageQuestionIds = questionsRaw.map(q => q.id);

    // 7. Người tạo (lms_users theo created_by_id)
    const creatorIds = Array.from(
      new Set(questionsRaw.map(q => q.created_by_id).filter((v): v is bigint => v !== null)),
    ).map(id => Number(id));
    const creators = creatorIds.length
      ? await prisma.lms_users.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, username: true, nickname: true },
        })
      : [];
    const creatorMap = new Map(creators.map(u => [u.id, u.nickname || u.username]));

    // 8. Độ khó (màu badge)
    const difficulties = await prisma.lms_difficulties.findMany({
      select: { name: true, color_code: true },
    });

    // 9. Làm giàu từng câu hỏi (options, tags, topics dạng nested cho QuestionModal)
    const questions: any[] = [];
    for (const q of questionsRaw) {
      const options = await prisma.lms_options.findMany({
        where: { question_id: q.id },
        orderBy: { order: 'asc' },
      });

      const tagRels = await prisma.lms_questions_tags.findMany({
        where: { question_id: q.id },
        include: { tag: true },
      });
      const tags = tagRels.map(r => ({
        id: Number(r.tag.id),
        name: r.tag.name,
        category: r.tag.category,
      }));

      const topicRels = await prisma.lms_topics_questions.findMany({
        where: { question_id: q.id },
        include: { topic: true },
      });
      const topics = topicRels.map(r => ({
        topic_id: Number(r.topic_id),
        topic: {
          id: Number(r.topic.id),
          title: r.topic.title ?? '',
          code: r.topic.code ?? null,
        },
      }));

      const qObj: any = {
        ...q,
        options,
        tags,
        topics,
        created_by_name: q.created_by_id ? creatorMap.get(Number(q.created_by_id)) ?? null : null,
        isClassified: topics.length > 0 && tags.length > 0,
      };

      // Câu chùm cha 'main' → gắn câu con 'sub'
      if (q.complex === 'main') {
        const subsRaw = await prisma.lms_questions.findMany({
          where: { ref_question_id: q.id, complex: 'sub' },
          orderBy: { id: 'asc' },
        });
        const subs: any[] = [];
        for (const sub of subsRaw) {
          const subOptions = await prisma.lms_options.findMany({
            where: { question_id: sub.id },
            orderBy: { order: 'asc' },
          });
          subs.push({ ...sub, options: subOptions });
        }
        qObj.sub_questions = subs;
      }

      questions.push(qObj);
    }

    return serializeBigInt({
      data: questions,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
      difficulties: difficulties.map(d => ({ name: d.name, color_code: d.color_code ?? '#888888' })),
    });
  } catch (error: any) {
    console.error('Error in getAllQuestions:', error?.message);
    return { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0, difficulties: [] };
  }
}
```

- [ ] **Step 2: Typecheck the action**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank
npx tsc --noEmit
```
Expected: no type errors referencing `question-list.ts`. (Pre-existing errors elsewhere, if any, are out of scope — confirm none are in the new file.)

- [ ] **Step 3: Commit**

```bash
git add src/actions/question-list.ts
git commit -m "feat(question-list): add getAllQuestions server action"
```

---

## Task 3: Add sidebar navigation entry

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` (navItems ~line 61-85; auto-open effect ~line 38-39)

- [ ] **Step 1: Add the child link**

In `src/components/layout/Sidebar.tsx`, find the "Xử lý tài liệu" entry and add a third child (keep the existing `FilePlus`/`FileUp` imports; add `ListChecks` to the existing `lucide-react` import):

```tsx
    {
      icon: FolderSync,
      label: 'Xử lý tài liệu',
      children: [
        { icon: FilePlus, label: 'Tạo thủ công', href: '/manual-create' },
        { icon: FileUp, label: 'Import tài liệu', href: '/import' },
        { icon: ListChecks, label: 'Danh sách câu hỏi', href: '/question-list' }
      ]
    },
```

- [ ] **Step 2: Update the auto-open submenu condition**

Find the effect that auto-opens the submenu (currently checks `/manual-create` or `/import`) and include `/question-list`:

```tsx
    if (pathname === '/manual-create' || pathname === '/import' || pathname === '/question-list') {
      setOpenSubmenus(prev => ({ ...prev, 'Xử lý tài liệu': true }));
    }
```

- [ ] **Step 3: Confirm import**

Ensure `ListChecks` is imported from `lucide-react` at the top of the file (add it to the existing destructured import). Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit
```
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(question-list): add sidebar link under Xử lý tài liệu"
```

---

## Task 4: Page server component

**Files:**
- Create: `src/app/(main)/question-list/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(main)/question-list/page.tsx`. It loads filter reference data (difficulties, tags grouped by category) and the current user, then renders the client manager. Reuses existing actions `getTagsByCategory` from `@/actions/question`.

```tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/utils/auth-utils';
import { getTagsByCategory } from '@/actions/question';
import QuestionListManager from '@/app/(main)/question-list/components/QuestionListManager';

export default async function QuestionListPage() {
  let difficulties: { id: number; name: string; color_code: string; display_order: number }[] = [];
  let tagsByCategory: Record<string, { id: number; name: string; category: string }[]> = {};
  let isAdmin = false;
  let currentUserId: number | null = null;

  try {
    const user = await getCurrentUser();
    currentUserId = user?.id ?? null;
    isAdmin = (user?.level_rank ?? 0) >= 5;

    const diffRaw = await prisma.lms_difficulties.findMany({
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    });
    difficulties = diffRaw.map(d => ({
      id: d.id,
      name: d.name,
      color_code: d.color_code ?? '#888888',
      display_order: d.display_order ?? 0,
    }));

    tagsByCategory = await getTagsByCategory();
  } catch (error) {
    console.error('Failed to load question-list page data:', error);
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface font-headline">Danh sách câu hỏi</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Toàn bộ câu hỏi trong hệ thống. Dùng bộ lọc để thu hẹp danh sách.
        </p>
      </div>

      <QuestionListManager
        difficulties={difficulties}
        tagsByCategory={tagsByCategory}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck (will fail until Task 5 creates the manager)**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit
```
Expected: error "Cannot find module '.../QuestionListManager'". This is expected; resolved in Task 5. Do not commit yet — commit page + manager together at end of Task 5.

---

## Task 5: Client manager (state + URL sync + data fetch)

**Files:**
- Create: `src/app/(main)/question-list/components/QuestionListManager.tsx`

- [ ] **Step 1: Create the manager**

Create `src/app/(main)/question-list/components/QuestionListManager.tsx`. It owns filter + page state, syncs to URL query params, debounces keyword, calls `getAllQuestions`, and renders the header + table. Filters always run (no "empty = show nothing" gate — this page shows everything by default).

```tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getAllQuestions } from '@/actions/question-list';
import QuestionListFilterHeader from './QuestionListFilterHeader';
import QuestionListTable from './QuestionListTable';

interface Tag { id: number; name: string; category: string }
interface Difficulty { id: number; name: string; color_code: string; display_order: number }

interface Props {
  difficulties: Difficulty[];
  tagsByCategory: Record<string, Tag[]>;
  isAdmin: boolean;
  currentUserId: number | null;
}

const PAGE_SIZE = 50;

export default function QuestionListManager({ difficulties, tagsByCategory, isAdmin, currentUserId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [grades, setGrades] = useState<number[]>(() => parseNums(searchParams.get('grades')));
  const [questionTypes, setQuestionTypes] = useState<string[]>(() => parseStrs(searchParams.get('questionTypes')));
  const [topicIds, setTopicIds] = useState<number[]>(() => parseNums(searchParams.get('topicIds')));
  const [tagIds, setTagIds] = useState<number[]>(() => parseNums(searchParams.get('tagIds')));
  const [keyword, setKeyword] = useState<string>(() => searchParams.get('keyword') || '');
  const [unclassified, setUnclassified] = useState<boolean>(() => searchParams.get('unclassified') === '1');
  const [page, setPage] = useState<number>(() => Math.max(1, Number(searchParams.get('page')) || 1));

  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  // Debounce keyword (400ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const syncUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Any filter change resets page to 1 and syncs URL
  const onFilterChange = useCallback((key: string, value: number[] | string[] | string | boolean) => {
    setPage(1);
    const updates: Record<string, string | null> = { page: '1' };
    if (key === 'grades') { setGrades(value as number[]); updates.grades = (value as number[]).length ? (value as number[]).join(',') : null; }
    else if (key === 'questionTypes') { setQuestionTypes(value as string[]); updates.questionTypes = (value as string[]).length ? (value as string[]).join(',') : null; }
    else if (key === 'topicIds') { setTopicIds(value as number[]); updates.topicIds = (value as number[]).length ? (value as number[]).join(',') : null; }
    else if (key === 'tagIds') { setTagIds(value as number[]); updates.tagIds = (value as number[]).length ? (value as number[]).join(',') : null; }
    else if (key === 'keyword') { setKeyword(value as string); updates.keyword = (value as string) || null; }
    else if (key === 'unclassified') { setUnclassified(value as boolean); updates.unclassified = (value as boolean) ? '1' : null; }
    syncUrl(updates);
  }, [syncUrl]);

  const onReset = useCallback(() => {
    setGrades([]); setQuestionTypes([]); setTopicIds([]); setTagIds([]); setKeyword(''); setUnclassified(false); setPage(1);
    syncUrl({ grades: null, questionTypes: null, topicIds: null, tagIds: null, keyword: null, unclassified: null, page: '1' });
  }, [syncUrl]);

  const onPageChange = useCallback((p: number) => {
    setPage(p);
    syncUrl({ page: String(p) });
  }, [syncUrl]);

  // Fetch
  const reqId = useRef(0);
  useEffect(() => {
    const myReq = ++reqId.current;
    setIsLoading(true);
    getAllQuestions(page, PAGE_SIZE, {
      grades, questionTypes, topicIds, tagIds, keyword: debouncedKeyword, unclassified,
    }).then(res => {
      if (myReq !== reqId.current) return; // ignore stale
      setQuestions(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 0);
      setIsLoading(false);
    });
  }, [grades, questionTypes, topicIds, tagIds, debouncedKeyword, unclassified, page]);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <QuestionListFilterHeader
        grades={grades}
        questionTypes={questionTypes}
        topicIds={topicIds}
        tagIds={tagIds}
        keyword={keyword}
        unclassified={unclassified}
        tagsByCategory={tagsByCategory}
        onChange={onFilterChange}
        onReset={onReset}
      />
      <QuestionListTable
        questions={questions}
        difficulties={difficulties}
        isLoading={isLoading}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onReset={onReset}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  );
}

function parseNums(v: string | null): number[] {
  return v ? v.split(',').map(Number).filter(n => !Number.isNaN(n)) : [];
}
function parseStrs(v: string | null): string[] {
  return v ? v.split(',').filter(Boolean) : [];
}
```

- [ ] **Step 2: Typecheck (will fail until Task 6 & 7 create header/table)**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit
```
Expected: errors "Cannot find module './QuestionListFilterHeader'" and "'./QuestionListTable'". Expected; resolved in Tasks 6-7. Do not commit yet.

---

## Task 6: Filter header component

**Files:**
- Create: `src/app/(main)/question-list/components/QuestionListFilterHeader.tsx`

- [ ] **Step 1: Create the header**

Create `src/app/(main)/question-list/components/QuestionListFilterHeader.tsx`. Horizontal layout. Uses `AppSelect` for grade and question-type (single-select that toggles into the multi arrays), `TopicTreeSelect` (multiple) for topics, a popover multi-select for tags grouped by category, a keyword input, an "unclassified" toggle, and a reset button.

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Tag as TagIcon, RotateCcw } from 'lucide-react';
import AppSelect from '@/components/ui/AppSelect';
import TopicTreeSelect from '@/components/ui/topic-tree-select';

interface Tag { id: number; name: string; category: string }

interface Props {
  grades: number[];
  questionTypes: string[];
  topicIds: number[];
  tagIds: number[];
  keyword: string;
  unclassified: boolean;
  tagsByCategory: Record<string, Tag[]>;
  onChange: (key: string, value: number[] | string[] | string | boolean) => void;
  onReset: () => void;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Trắc nghiệm 1 đáp án',
  multiple_choice: 'Trắc nghiệm nhiều đáp án',
  true_false: 'Đúng / Sai',
  fill_in_the_blank: 'Điền khuyết',
  essay: 'Tự luận',
};

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function QuestionListFilterHeader({
  grades, questionTypes, topicIds, tagIds, keyword, unclassified,
  tagsByCategory, onChange, onReset,
}: Props) {
  const [tagOpen, setTagOpen] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) setTagOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleTag = (id: number) => {
    onChange('tagIds', tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id]);
  };

  // AppSelect emits a single value; we add it to the array (and allow clearing via the placeholder option).
  const handleGradeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const g = Number(e.target.value);
    if (!g) return;
    onChange('grades', grades.includes(g) ? grades : [...grades, g]);
  };
  const handleTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const t = e.target.value;
    if (!t) return;
    onChange('questionTypes', questionTypes.includes(t) ? questionTypes : [...questionTypes, t]);
  };

  const tagCount = tagIds.length;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xs">
      {/* Row 1: search + unclassified + reset */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex items-center flex-1 min-w-[240px]">
          <Search className="absolute left-3 w-4 h-4 text-outline" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onChange('keyword', e.target.value)}
            placeholder="Tìm theo đề bài, nội dung..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm font-semibold border border-outline-variant/30 bg-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
          />
          {keyword && (
            <button onClick={() => onChange('keyword', '')} className="absolute right-3 text-outline hover:text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unclassified}
            onChange={(e) => onChange('unclassified', e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          Chỉ hiện chưa phân loại
        </label>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold text-outline hover:text-error hover:border-error/30 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Xóa bộ lọc
        </button>
      </div>

      {/* Row 2: selects */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="w-[150px]">
          <AppSelect value="" onChange={handleGradeSelect} placeholder="Khối lớp">
            <option value="">Khối lớp</option>
            {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
          </AppSelect>
        </div>

        <div className="w-[220px]">
          <AppSelect value="" onChange={handleTypeSelect} placeholder="Hình thức câu hỏi">
            <option value="">Hình thức câu hỏi</option>
            {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </AppSelect>
        </div>

        <div className="min-w-[260px] flex-1">
          <TopicTreeSelect
            multiple
            value={topicIds.map(String)}
            onChange={(v) => onChange('topicIds', Array.isArray(v) ? v.map(Number) : [])}
            placeholder="Lọc theo chủ đề..."
          />
        </div>

        {/* Tags popover */}
        <div className="relative" ref={tagRef}>
          <button
            onClick={() => setTagOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface text-sm font-semibold hover:border-primary/40 transition-all"
          >
            <TagIcon className="w-4 h-4 text-primary" />
            Thẻ tags{tagCount > 0 ? ` (${tagCount})` : ''}
          </button>
          {tagOpen && (
            <div className="absolute right-0 mt-2 w-[360px] max-h-[400px] overflow-y-auto p-4 rounded-2xl border border-outline-variant/30 bg-surface shadow-xl z-50 flex flex-col gap-4">
              {Object.entries(tagsByCategory).filter(([_, list]) => list.length > 0).map(([cat, list]) => (
                <div key={cat} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase text-outline tracking-wider border-b border-outline-variant/10 pb-0.5">{cat}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map(tag => {
                      const active = tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${active ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary/20'}`}
                        >
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active chips for grades & types (so the user can remove them; AppSelect only adds) */}
      {(grades.length > 0 || questionTypes.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {grades.map(g => (
            <button key={`g${g}`} onClick={() => onChange('grades', grades.filter(x => x !== g))}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">
              Lớp {g} <X className="w-3 h-3" />
            </button>
          ))}
          {questionTypes.map(t => (
            <button key={`t${t}`} onClick={() => onChange('questionTypes', questionTypes.filter(x => x !== t))}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold">
              {QUESTION_TYPE_LABELS[t] || t} <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit
```
Expected: only the remaining "Cannot find module './QuestionListTable'" error. Do not commit yet.

---

## Task 7: Read-only table + pagination + detail modal

**Files:**
- Create: `src/app/(main)/question-list/components/QuestionListTable.tsx`

- [ ] **Step 1: Create the table**

Create `src/app/(main)/question-list/components/QuestionListTable.tsx`. Read-only rows, "Xem chi tiết" opens `QuestionModal` (with `showEditButton={false}`), pagination at the bottom, empty state with reset.

```tsx
'use client';

import { useState } from 'react';
import { Eye, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import QuestionModal from '@/app/(main)/question-bank/components/QuestionModal';
import AppBadge from '@/components/ui/AppBadge';
import { getQuestionDisplayContent, cleanMathpixData } from '@/lib/utils/math-utils';

interface Difficulty { id: number; name: string; color_code: string; display_order: number }

interface Props {
  questions: any[];
  difficulties: Difficulty[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onReset: () => void;
  isAdmin: boolean;
  currentUserId: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  single_choice: 'TN 1 đáp án',
  multiple_choice: 'TN nhiều đáp án',
  true_false: 'Đúng/Sai',
  fill_in_the_blank: 'Điền khuyết',
  essay: 'Tự luận',
};

function snippet(q: any): string {
  const raw = getQuestionDisplayContent ? getQuestionDisplayContent(cleanMathpixData ? cleanMathpixData(q.statement || '') : (q.statement || '')) : (q.statement || '');
  const text = String(raw).replace(/[#*`>$_~]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 120 ? text.slice(0, 120) + '…' : text || '(không có nội dung)';
}

export default function QuestionListTable({
  questions, difficulties, isLoading, total, page, totalPages, onPageChange, onReset, isAdmin, currentUserId,
}: Props) {
  const [selected, setSelected] = useState<any | null>(null);

  if (!isLoading && questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-on-surface-variant py-16">
        <Inbox className="w-12 h-12 opacity-40" />
        <p className="font-semibold">Không có câu hỏi nào khớp bộ lọc.</p>
        <button onClick={onReset} className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold hover:border-primary/40">
          Xóa bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-auto rounded-2xl border border-outline-variant/20">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-surface-container-low z-10">
            <tr className="text-left text-xs uppercase tracking-wider text-outline">
              <th className="px-3 py-3 font-extrabold">ID</th>
              <th className="px-3 py-3 font-extrabold min-w-[280px]">Nội dung</th>
              <th className="px-3 py-3 font-extrabold">Khối</th>
              <th className="px-3 py-3 font-extrabold">Độ khó</th>
              <th className="px-3 py-3 font-extrabold">Hình thức</th>
              <th className="px-3 py-3 font-extrabold">Chủ đề</th>
              <th className="px-3 py-3 font-extrabold">Tags</th>
              <th className="px-3 py-3 font-extrabold">Người tạo</th>
              <th className="px-3 py-3 font-extrabold">Ngày tạo</th>
              <th className="px-3 py-3 font-extrabold">Phân loại</th>
              <th className="px-3 py-3 font-extrabold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={11} className="px-3 py-10 text-center text-on-surface-variant">Đang tải...</td></tr>
            ) : questions.map((q) => (
              <tr key={q.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low/40 align-top">
                <td className="px-3 py-3 font-mono text-xs text-outline">{q.code || q.id}</td>
                <td className="px-3 py-3 text-on-surface">{snippet(q)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{q.grade ? `Lớp ${q.grade}` : '—'}</td>
                <td className="px-3 py-3"><AppBadge difficultyName={q.question_difficulty} difficulties={difficulties as any} /></td>
                <td className="px-3 py-3 whitespace-nowrap text-xs">{TYPE_LABELS[q.question_type] || q.question_type || '—'}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(q.topics || []).slice(0, 3).map((t: any) => (
                      <span key={t.topic_id} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{t.topic?.title}</span>
                    ))}
                    {(q.topics || []).length > 3 && <span className="text-[10px] text-outline">+{q.topics.length - 3}</span>}
                    {(q.topics || []).length === 0 && <span className="text-[10px] text-outline">—</span>}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(q.tags || []).slice(0, 3).map((t: any) => (
                      <span key={t.id} className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">#{t.name}</span>
                    ))}
                    {(q.tags || []).length > 3 && <span className="text-[10px] text-outline">+{q.tags.length - 3}</span>}
                    {(q.tags || []).length === 0 && <span className="text-[10px] text-outline">—</span>}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs">{q.created_by_name || '—'}</td>
                <td className="px-3 py-3 whitespace-nowrap text-xs text-outline">{q.created_at ? new Date(q.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                <td className="px-3 py-3">
                  {q.isClassified
                    ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Đã phân loại</span>
                    : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Chưa phân loại</span>}
                </td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => setSelected(q)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold hover:border-primary/40 hover:text-primary">
                    <Eye className="w-3.5 h-3.5" /> Xem
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs text-on-surface-variant font-semibold">
          Tổng <strong className="text-on-surface">{total}</strong> câu • Trang {page}/{Math.max(1, totalPages)}
        </span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40 hover:border-primary/40">
            <ChevronLeft className="w-4 h-4" /> Trước
          </button>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold disabled:opacity-40 hover:border-primary/40">
            Sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selected && (
        <QuestionModal
          question={selected}
          onClose={() => setSelected(null)}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          showEditButton={false}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the full feature**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npx tsc --noEmit
```
Expected: no type errors in any `question-list` file or `question-list.ts`.

- [ ] **Step 3: Commit page + manager + header + table together**

```bash
git add "src/app/(main)/question-list"
git commit -m "feat(question-list): add page, manager, filter header and table UI"
```

---

## Task 8: End-to-end verification & regression

**Files:** none (verification only)

- [ ] **Step 1: Build**

Run:
```bash
cd /home/ngcoogiapw/ngcoogiapw/project_questionbank && npm run build
```
Expected: build succeeds; `/question-list` appears in the route list; no errors from new files.

- [ ] **Step 2: Manual verification (dev server)**

Run `npm run dev`, open `http://localhost:3000/question-list`, and walk through `specs/010-page-list/quickstart.md`. Confirm at minimum:
- Sidebar "Xử lý tài liệu" shows "Danh sách câu hỏi"; submenu auto-opens on the route.
- Table shows ≤50 rows + pagination; columns include Người tạo and Ngày tạo.
- Filters (grade, type, topic recursion, tags AND-across-categories, keyword debounce, "chưa phân loại" toggle) each narrow results; changing any resets to page 1; URL query params update and restore on reload.
- "Xem" opens `QuestionModal` read-only (no edit button).
- Empty state shows with a working "Xóa bộ lọc".

- [ ] **Step 3: Role-based visibility check**

Log in as a **non-admin** and an **admin**:
- Non-admin: cannot see another user's private (`public='0'`) question; can see `public='1'`, `null`, and own questions.
- Admin: sees private questions too.

(If only one account is available, verify the query branch by temporarily logging the computed `where` in `getAllQuestions` and confirming the `OR` visibility block is present for non-admin and absent for admin. Remove the log before committing.)

- [ ] **Step 4: Regression check**

- Open `/question-bank` — confirm it still loads and filters work (unchanged).
- Confirm `getLibraryQuestions` was not modified: `git diff --stat main -- src/actions/question.ts` shows no changes.

- [ ] **Step 5: Remove the throwaway verification script (optional)**

```bash
git rm scripts/verify-question-filters.ts
git commit -m "chore(question-list): remove temporary filter verification script"
```
(Skip if you want to keep it as a DB sanity tool.)

---

## Self-review notes (spec coverage)

- FR-001 → Task 3 + Task 4. FR-002/003 → Task 2 (`getAllQuestions`, pageSize 50). FR-004 (permissions) → Task 2 step 1 §1 + Task 8 step 3. FR-005 (sub grouping) → Task 2 §2 + §9. FR-006 (filters) → Task 2 §3-§5 + Task 1. FR-007 (unclassified) → Task 1 `getClassifiedQuestionIds` + Task 2 §5. FR-008 (topic recursion) → Task 1 `resolveTopicQuestionIds`. FR-009 (type vs TYPE tag split) → Task 6 (separate AppSelect for `question_type`; TYPE tags inside tag popover). FR-010 (header UI) → Task 6. FR-011/012 (table cols incl. creator) → Task 7 + Task 2 §7. FR-013 (read-only modal) → Task 7 (`showEditButton={false}`). FR-014 (URL state) → Task 5. FR-015 (shared helper, no refactor of getLibraryQuestions) → Task 1 + Task 8 step 4.
- Return shape note: `getAllQuestions` returns `{ data, total, page, pageSize, totalPages, difficulties }` (matching the existing `getLibraryQuestions` convention and the shape `QuestionModal` consumes) rather than the abstract `{ questions, pagination }` sketch in `data-model.md`. Each item is a full question object incl. nested `topics`, `options`, `tags`, `sub_questions`, plus `created_by_name` and `isClassified`. This refinement was made because `QuestionModal` requires the full nested shape.
