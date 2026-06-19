# Data Model & Contracts: Trang Danh sách Câu hỏi

**Feature**: `010-page-list` | **Date**: 2026-06-17

Tính năng không thêm bảng/cột mới — chỉ đọc dữ liệu hiện có. Phần này mô tả thực thể liên quan và contract của Server Action.

## 1. Thực thể & trường liên quan (read-only)

### lms_questions (chính)
| Trường | Dùng cho |
|--------|----------|
| `id` | Khóa, sắp xếp (desc), cột ID |
| `statement`, `content` | Nội dung hiển thị + tìm kiếm keyword |
| `grade` | Lọc + cột Khối lớp |
| `question_difficulty` | Cột Độ khó (map sang `lms_difficulties`) |
| `question_type` | Lọc + cột Hình thức |
| `complex`, `ref_question_id` | Ẩn câu con `sub`, gộp vào câu cha |
| `public` | Phân quyền hiển thị |
| `created_by_id`, `owned_by_id`, `teacher_owned_by_id` | Phân quyền (sở hữu) |
| `created_at` | Cột Ngày tạo |
| `code` | Cột mã (nếu có) |

### lms_topics / lms_topics_questions
- `lms_topics.path`: lọc đệ quy (so khớp `startsWith`).
- `lms_topics_questions(topic_id, question_id)`: liên kết câu–chủ đề; dùng xác định "đã có chủ đề".

### lms_tags / lms_questions_tags
- `lms_tags.category`: gom nhóm tag (SOURCE, METHOD, SKILL, TYPE, EXAM, YEAR).
- `lms_questions_tags(question_id, tag_id)`: liên kết câu–tag; dùng xác định "đã có tag".

### lms_difficulties
- `name`, `color_code`: render badge độ khó.

### lms_users
- `nickname`, `username`: tên người tạo (join theo `created_by_id`).

## 2. Quy tắc phân quyền (server-side)

```
isAdmin = level_rank >= 5

if isAdmin:
    # không thêm điều kiện public → thấy tất cả kể cả '0'
    visibilityWhere = {}
else:
    visibilityWhere = OR[
        { public: '1' },
        { public: null },
        { created_by_id: userId },
        { owned_by_id: userId },
        { teacher_owned_by_id: userId },
    ]
```

Lưu ý: câu private (`public='0'`) do chính user sở hữu vẫn hiển thị với user đó (nhờ nhánh sở hữu).

## 3. Quy tắc "chưa phân loại" (`unclassified=true`)

Câu được coi là **chưa phân loại** nếu **thiếu chủ đề HOẶC thiếu tag**:

```
classifiedTopicIds = distinct(question_id) FROM lms_topics_questions
classifiedTagIds   = distinct(question_id) FROM lms_questions_tags
hasBoth            = classifiedTopicIds ∩ classifiedTagIds
unclassifiedSet    = ALL question ids \ hasBoth      # thiếu ít nhất một trong hai
```

Triển khai: lấy 2 tập distinct (theo `id IN targetIds` để giới hạn phạm vi), giao nhau ra tập "đã đủ", rồi `where.id = { notIn: hasBoth }` (kết hợp với các điều kiện khác). Tránh lặp từng câu.

## 4. Quy tắc câu hỏi chùm

```
where.AND.push(OR[ { complex: { not: 'sub' } }, { complex: null } ])
```
Câu con `sub` được gộp hiển thị bên trong câu cha qua `ref_question_id` ở tầng trả về (giống `getLibraryQuestions`).

## 5. Contract — Server Action `getAllQuestions`

**File**: `src/actions/question-list.ts`

```ts
type QuestionListFilters = {
  grades?: number[];
  questionTypes?: string[];
  topicIds?: number[];
  tagIds?: number[];
  keyword?: string;
  unclassified?: boolean;
};

async function getAllQuestions(
  page: number = 1,
  pageSize: number = 50,
  filters: QuestionListFilters = {}
): Promise<{
  questions: QuestionListItem[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}>
```

### QuestionListItem (đã serialize BigInt)
```ts
type QuestionListItem = {
  id: number;
  code: string | null;
  statement: string;
  grade: string | null;
  question_difficulty: string | null;
  question_type: string | null;
  complex: string | null;
  topics: { topic_id: number; title: string }[];
  tags: { id: number; name: string; category: string }[];
  difficulty_color?: string | null;
  created_by_name: string | null;
  created_at: string | null;   // ISO
  isClassified: boolean;        // có đủ chủ đề & tag
};
```

### Thứ tự xử lý trong action
1. `getCurrentUser` → `userId`, `isAdmin`.
2. Dựng `whereClause`: visibility + ẩn `sub` + `grade`/`question_type` + keyword.
3. Lọc topic đệ quy & tag qua helper `question-filters.ts` (thu hẹp tập `id`).
4. Nếu `unclassified` → tính `hasBoth` và thêm `notIn`.
5. `count` + `findMany` (orderBy `id` desc, skip/take theo trang).
6. Nạp kèm topics, tags, tên người tạo, màu độ khó; `serializeBigInt`.

## 6. Helper dùng chung — `src/lib/services/question-filters.ts`

```ts
// Trả về danh sách question_id thuộc các chủ đề (đệ quy theo path) đã chọn
resolveTopicQuestionIds(topicIds: number[]): Promise<bigint[]>

// Lọc tập question_id theo tag (OR trong category, AND giữa category)
filterByTags(questionIds: bigint[], tagIds: number[]): Promise<bigint[]>
```
Logic trích từ `getLibraryQuestions` hiện có (không sửa bản gốc).

## Cập nhật bởi 011-question-requests
- `getAllQuestions` thêm tham số `options.prioritizeRequests` và trả `pendingRequestCount` mỗi item (đẩy câu có request PENDING lên đầu cho admin). Chi tiết: `specs/011-question-requests/data-model.md` mục 5.
- Modal "Xem chi tiết" đổi từ `QuestionModal` sang `QuestionDetailModal` (role-aware).
