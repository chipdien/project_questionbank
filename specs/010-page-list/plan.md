# Kế hoạch Triển khai: Trang Danh sách Câu hỏi (Question List)

**Branch**: `010-page-list` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Đặc tả tính năng từ `/specs/010-page-list/spec.md`

## Summary

Xây dựng trang mới `/question-list` — mục con của submenu "Xử lý tài liệu" — hiển thị toàn bộ câu hỏi trong DB (theo phân quyền, trừ private của người khác), phân trang 50 câu/trang, với bộ lọc dạng header ngang (khối lớp, hình thức câu hỏi, chủ đề đệ quy, tags gom theo category, từ khóa, toggle "chưa phân loại") và bảng read-only có cột Người tạo, Ngày tạo, nút "Xem chi tiết".

### Giải pháp kỹ thuật

1. **Server Action mới** `getAllQuestions` trong file riêng `src/actions/question-list.ts`, quét trực tiếp `lms_questions` (không join documents). Phân quyền: admin thấy tất cả (kể cả private); non-admin thấy `public IN ('1', null)` HOẶC câu của mình (`created_by_id`/`owned_by_id`/`teacher_owned_by_id`).
2. **Helper dùng chung** `src/lib/services/question-filters.ts`: tách logic resolve chủ đề đệ quy theo `path` và gom/lọc tag theo category. `getAllQuestions` import dùng. `getLibraryQuestions` giữ nguyên.
3. **Bộ lọc "chưa phân loại"**: tính bằng truy vấn gộp lấy distinct `question_id` từ `lms_topics_questions` và `lms_questions_tags`, suy ra tập câu thiếu chủ đề HOẶC thiếu tag, đưa vào `where`.
4. **Giao diện** (Hướng 1 — component mới, tái dùng phần tử nhỏ): `QuestionListManager` (client, quản lý state + URL) → `QuestionListFilterHeader` (header ngang dùng `AppSelect`/`topic-tree-select`/ô tag/ô search) + `QuestionListTable` (bảng read-only + phân trang) → tái dùng `QuestionModal` cho "Xem chi tiết".
5. **Điều hướng**: thêm mục con vào `navItems` trong `Sidebar.tsx` và cập nhật auto-mở submenu.
6. **URL state**: đồng bộ filter + page lên query params bằng `useRouter`/`useSearchParams` (App Router).

## Technical Context

**Language/Version**: TypeScript, Node.js v20+, React 19 (Next.js v16.x App Router)

**Primary Dependencies**: Next.js App Router, Prisma ORM (MySQL), Tailwind CSS, Lucide React, react-markdown + katex (hiển thị nội dung).

**Storage**: MySQL qua Prisma Client.

**Testing**: Kiểm thử thủ công trên giao diện + kiểm thử Server Action.

**Target Platform**: Web Browsers.

**Project Type**: Web Application (Next.js single project).

**Performance Goals**: `getAllQuestions` < 500ms với ~33.000 câu hỏi, phân trang 50 câu.

**Constraints**: Không sửa `getLibraryQuestions`/trang `question-bank`; tái dùng component dùng chung; an toàn phân quyền.

**Scale/Scope**: Trang `/question-list` mới và các component liên quan; 1 action mới + 1 helper mới + 1 thay đổi `Sidebar.tsx`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Không vi phạm quy tắc cốt lõi của dự án.
- Tuân thủ cấu trúc Single Project.
- Server Action chuẩn hóa, kiểm tra phân quyền ở phía server.
- Tách helper dùng chung thay vì copy logic.

## Project Structure

### Documentation (this feature)

```text
specs/010-page-list/
├── spec.md              # Đặc tả tính năng
├── plan.md              # File kế hoạch này
├── research.md          # Kết quả nghiên cứu Phase 0
├── data-model.md        # Thiết kế dữ liệu Phase 1
├── quickstart.md        # Hướng dẫn xác thực/chạy thử
├── tasks.md             # Danh sách công việc triển khai
└── checklists/
    └── requirements.md  # Checklist chất lượng đặc tả
```

### Source Code (repository root)

```text
src/
├── actions/
│   └── question-list.ts                # MỚI: getAllQuestions
├── lib/services/
│   └── question-filters.ts             # MỚI: helper resolve topic/tag dùng chung
├── components/layout/
│   └── Sidebar.tsx                     # SỬA: thêm mục con "Danh sách câu hỏi"
└── app/(main)/question-list/
    ├── page.tsx                        # MỚI: server component, nạp dữ liệu lọc
    └── components/
        ├── QuestionListManager.tsx     # MỚI: client, state + URL sync
        ├── QuestionListFilterHeader.tsx# MỚI: header lọc ngang
        └── QuestionListTable.tsx       # MỚI: bảng read-only + phân trang
```

Tái sử dụng (không sửa): `QuestionModal`, `AppSelect`, `AppBadge`, `topic-tree-select`, `serializeBigInt`, `getCurrentUser`.

## Phase 0 — Research

Xem [research.md](./research.md). Trọng tâm: quy ước `public`, chiến lược truy vấn "chưa phân loại" hiệu năng, mức tái sử dụng component.

## Phase 1 — Design

Xem [data-model.md](./data-model.md) và [quickstart.md](./quickstart.md).

## Phase 2 — Tasks

Xem [tasks.md](./tasks.md).
