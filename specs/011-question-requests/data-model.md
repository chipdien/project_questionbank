# Data Model & Migration: Question Requests

**Feature**: `011-question-requests` | **Date**: 2026-06-17

## 1. Migration log (BẮT BUỘC tài liệu hóa)

**Migration name**: `011_add_question_request_fields`
**Table**: `lms_requests` (chỉ THÊM cột, không sửa/xóa cột cũ)
**Áp dụng thực tế (2026-06-17)**: `prisma migrate dev` bị từ chối tạo shadow DB trên MySQL managed (P3014/P1010) → đã áp dụng bằng `prisma db push`. SQL tương đương lưu tại `prisma/migrations/manual_011_add_question_request_fields.sql`. Đã verify 3 cột tồn tại (`scripts/verify-request-columns.ts` → VERIFY OK).

| Hành động | Cột | Kiểu (MySQL) | Null | Default | Index |
|---|---|---|---|---|---|
| ADD | `question_id` | `BIGINT` | YES | `NULL` | `idx_lms_requests_question_id` |
| ADD | `status` | `VARCHAR(50)` | NO | `'PENDING'` | `idx_lms_requests_status` |
| ADD | `admin_note` | `LONGTEXT` | YES | `NULL` | — |

SQL tương đương (tham chiếu — thực thi qua `prisma migrate`):
```sql
ALTER TABLE lms_requests
  ADD COLUMN question_id BIGINT NULL,
  ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN admin_note LONGTEXT NULL;
CREATE INDEX idx_lms_requests_question_id ON lms_requests (question_id);
CREATE INDEX idx_lms_requests_status ON lms_requests (status);
```

Prisma model `lms_requests` sau migration:
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
Không thêm Prisma relation tới `lms_questions` (join thủ công theo `question_id`).

## 2. Quy ước giá trị

- `type`: `EDIT` | `CLASSIFY` | `REPORT`
- `status`: `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED` (default `PENDING`)
- `content_suggest`:
  - `CLASSIFY`: JSON `{ "grade": number|null, "topicIds": number[], "tagIds": number[] }`
  - `EDIT`: text (nội dung đề bài/đáp án đề xuất)
  - `REPORT`: không dùng (để trống)
- `content`:
  - `CLASSIFY`: ghi chú (tùy chọn)
  - `EDIT`: lý do sửa
  - `REPORT`: mô tả lỗi + gợi ý

## 3. Vòng đời

```
PENDING ──approve──▶ APPROVED
   │  └──reject────▶ REJECTED (admin_note = lý do)
   └────cancel─────▶ CANCELLED (chủ sở hữu)
```
Chỉ chuyển trạng thái từ `PENDING`. Đã rời `PENDING` thì khóa.

## 4. Contracts — Server actions (`src/actions/question-request.ts`)

```ts
type RequestType = 'EDIT' | 'CLASSIFY' | 'REPORT';
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface ClassifySuggest { grade: number | null; topicIds: number[]; tagIds: number[]; }

createQuestionRequest(input: {
  questionId: number;
  type: RequestType;
  title?: string;
  content?: string;
  contentSuggest?: ClassifySuggest | string;  // object cho CLASSIFY, string cho EDIT
}): Promise<{ success: boolean; id?: number; error?: string }>;

getQuestionRequests(
  filters: { types?: RequestType[]; statuses?: RequestStatus[] },
  page?: number,
  pageSize?: number
): Promise<{
  data: RequestListItem[];
  total: number; page: number; pageSize: number; totalPages: number;
}>;

getRequestsForQuestion(questionId: number): Promise<RequestListItem[]>;

cancelQuestionRequest(id: number): Promise<{ success: boolean; error?: string }>;
approveQuestionRequest(id: number): Promise<{ success: boolean; error?: string }>;
rejectQuestionRequest(id: number, reason: string): Promise<{ success: boolean; error?: string }>;

getPendingRequestCount(): Promise<number>;
```

### RequestListItem (đã serialize BigInt)
```ts
interface RequestListItem {
  id: number;
  question_id: number | null;
  type: RequestType;
  status: RequestStatus;
  title: string | null;
  content: string | null;
  content_suggest: string | null;     // raw; CLASSIFY parse JSON ở UI
  admin_note: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  updated_by_id: number | null;
  created_at: string | null;          // ISO
  updated_at: string | null;
  question_statement: string | null;  // trích đoạn câu hỏi (null nếu câu đã xóa)
}
```

## 5. Mở rộng `getAllQuestions` (010)

Thêm tham số:
```ts
getAllQuestions(page, pageSize, filters, options?: { prioritizeRequests?: boolean })
```
- Khi `prioritizeRequests` (admin bật): trả thêm `pendingRequestCount: number` mỗi item; sắp câu có `PENDING` request lên đầu.
- Phân trang 2 đoạn: đoạn 1 = tập `requestedIds` (distinct `question_id` từ `lms_requests` `status='PENDING'`, giao với `where` hiện tại) theo `id` desc; đoạn 2 = phần còn lại (`id notIn requestedIds`) theo `id` desc. Cắt theo `offset`/`take` trải dọc 2 đoạn.
- `requestedIds` là hàng đợi admin (nhỏ) → giữ trong bộ nhớ an toàn.
- Khi không bật cờ → hành vi y như cũ (non-admin không đổi).
