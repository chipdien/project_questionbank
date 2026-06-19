# Kế hoạch Triển khai: Question Requests

**Branch**: `011-question-requests` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

## Summary

Luồng request 3 loại (EDIT/CLASSIFY/REPORT) cho giáo viên đề xuất, admin duyệt. Lưu vào `lms_requests` (thêm `question_id`, `status`, `admin_note`). Giáo viên gửi từ modal chi tiết trên `/question-list`; admin xử lý ở trang `/requests` riêng + ưu tiên câu có request trên `/question-list` + badge chuông header. Áp dụng đề xuất bằng cách tái dùng `classifyQuestions` và `PATCH /api/questions/[id]`.

### Giải pháp kỹ thuật
1. **Migration** `011_add_question_request_fields` — thêm 3 cột + 2 index vào `lms_requests` (tài liệu hóa trong `data-model.md`).
2. **Actions mới** `src/actions/question-request.ts`: create / get list (role-aware) / get-by-question / cancel / approve / reject / pending-count.
3. **Mở rộng `getAllQuestions`** (010) — cờ `prioritizeRequests` + `pendingRequestCount`, phân trang 2 đoạn.
4. **UI giáo viên**: `QuestionDetailModal` mới (thay `QuestionModal` trên `/question-list`) + `RequestSubmitModal` (3 chế độ) + danh sách request của câu + hủy.
5. **UI admin**: trang `/requests` (role-aware) + `RequestReviewModal` (áp dụng/duyệt/từ chối) + thao tác trong `QuestionDetailModal`.
6. **Header**: badge chuông `TopNavBar` dùng `getPendingRequestCount`, bấm → `/requests`.
7. **Sidebar**: thêm mục "Yêu cầu" → `/requests`.

## Technical Context

**Language/Version**: TypeScript, React 19, Next.js 16 App Router
**Storage**: MySQL qua Prisma (relationMode prisma)
**Dependencies**: Prisma, Tailwind, lucide-react, react-markdown/katex, react-hot-toast
**Testing**: tsx script cho action thuần (nếu khả thi), `npm run build` typecheck, manual quickstart, 2 tài khoản (admin + giáo viên)
**Constraints**: chỉ THÊM cột (không sửa cột cũ); tái dùng `classifyQuestions`/`PATCH question`; phân quyền ở server
**Project Type**: Web app (single project)

## Constitution Check
- Single project, không vi phạm quy tắc cốt lõi.
- Migration tài liệu hóa rõ ràng (yêu cầu người dùng).
- Action chuẩn hóa, kiểm tra quyền server-side.

## Project Structure

```text
specs/011-question-requests/
├── spec.md
├── plan.md
├── data-model.md
├── research.md
├── quickstart.md
├── tasks.md
└── checklists/requirements.md
```

```text
prisma/
└── schema.prisma                      # SỬA: thêm 3 cột + index vào lms_requests
src/
├── actions/
│   ├── question-request.ts            # MỚI: các action request
│   └── question-list.ts               # SỬA: getAllQuestions thêm prioritizeRequests/pendingRequestCount
├── app/(main)/
│   ├── requests/
│   │   ├── page.tsx                    # MỚI: trang /requests (role-aware)
│   │   └── components/
│   │       ├── RequestsManager.tsx     # MỚI: client list + filters + role
│   │       ├── RequestList.tsx         # MỚI: bảng/list request
│   │       └── RequestReviewModal.tsx  # MỚI: admin duyệt/từ chối/áp dụng
│   └── question-list/components/
│       ├── QuestionDetailModal.tsx     # MỚI: thay QuestionModal trên /question-list (role-aware)
│       ├── RequestSubmitModal.tsx      # MỚI: form gửi 3 loại request
│       └── QuestionListTable.tsx       # SỬA: dùng QuestionDetailModal, badge "N yêu cầu"
└── components/layout/
    ├── TopNavBar.tsx                   # SỬA: badge chuông + link /requests
    └── Sidebar.tsx                     # SỬA: thêm mục "Yêu cầu"
```

Tái dùng: `classifyQuestions` (`@/actions/question`), `PATCH /api/questions/[id]`, `AddToCollectionModal`, `QuestionEditModal`, `AppSelect`, `topic-tree-select`, `AppBadge`, util math.

## Cập nhật 010-page-list
- `specs/010-page-list/spec.md`, `data-model.md`, `tasks.md`: thêm ghi chú trỏ sang `011` ở `getAllQuestions` và phần modal chi tiết.

## Phases
- Phase 0: research.md
- Phase 1: data-model.md, quickstart.md
- Phase 2: tasks.md
