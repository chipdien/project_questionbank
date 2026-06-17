# Tasks: Question Requests

**Feature**: `011-question-requests` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

`[P]` = song song được. Theo thứ tự ưu tiên.

## Phase 1 — Database
- [ ] **T001** Sửa `prisma/schema.prisma`: thêm `question_id BigInt?`, `status String @default("PENDING") @db.VarChar(50)`, `admin_note String? @db.LongText` + 2 index vào model `lms_requests` (theo `data-model.md`).
- [ ] **T002** Chạy `npx prisma migrate dev --name 011_add_question_request_fields` + `npx prisma generate`. Xác nhận migration tạo đúng cột/index.

## Phase 2 — Server actions
- [ ] **T003** Tạo `src/actions/question-request.ts`:
  - [ ] T003a `createQuestionRequest` (validate type; CLASSIFY → JSON.stringify content_suggest; set created_by_id, status PENDING).
  - [ ] T003b `getQuestionRequests` (role-aware; PENDING-first, created_at desc; kèm question_statement + created_by_name; phân trang).
  - [ ] T003c `getRequestsForQuestion` (role-aware).
  - [ ] T003d `cancelQuestionRequest` (owner + PENDING).
  - [ ] T003e `approveQuestionRequest` (admin + PENDING).
  - [ ] T003f `rejectQuestionRequest(id, reason)` (admin + PENDING; lưu admin_note).
  - [ ] T003g `getPendingRequestCount` (admin = tổng; non-admin = của mình).
- [ ] **T004** Mở rộng `getAllQuestions` trong `src/actions/question-list.ts`: tham số `options.prioritizeRequests`; trả `pendingRequestCount`; phân trang 2 đoạn (requested-first). Giữ nguyên hành vi khi cờ tắt.

## Phase 3 — UI giáo viên (trên /question-list)
- [ ] **T005** Tạo `RequestSubmitModal.tsx` (3 chế độ EDIT/CLASSIFY/REPORT; dùng AppSelect/topic-tree-select/tags; gọi createQuestionRequest).
- [ ] **T006** Tạo `QuestionDetailModal.tsx` (role-aware): render câu hỏi (util math/markdown) read-only; giáo viên: 4 nút (sửa/phân loại/báo lỗi/collection) + danh sách request của mình + hủy; admin: tất cả request + duyệt/từ chối/áp dụng + sửa/phân loại trực tiếp.
- [ ] **T007** Sửa `QuestionListTable.tsx`: thay `QuestionModal` bằng `QuestionDetailModal`; hiển thị badge "N yêu cầu" (từ `pendingRequestCount`).
- [ ] **T008** Bật `prioritizeRequests` khi admin trong `QuestionListManager` (truyền isAdmin → getAllQuestions options).

## Phase 4 — UI admin (/requests) + header + sidebar
- [ ] **T009** Tạo `RequestReviewModal.tsx` (admin): hiển thị đề xuất ↔ hiện trạng; CLASSIFY/EDIT "Áp dụng & duyệt" (classifyQuestions / PATCH question → approve); REPORT đánh dấu xử lý; "Từ chối" + lý do.
- [ ] **T010** Tạo `src/app/(main)/requests/page.tsx` + `RequestsManager.tsx` + `RequestList.tsx` (role-aware: admin tất cả + lọc; giáo viên của mình + hủy).
- [ ] **T011** Sửa `TopNavBar.tsx`: badge chuông từ `getPendingRequestCount`; bấm → `/requests`.
- [ ] **T012** Sửa `Sidebar.tsx`: thêm mục "Yêu cầu" → `/requests`.

## Phase 5 — Cập nhật 010 & kiểm thử
- [ ] **T013** Cập nhật `specs/010-page-list/` (spec.md/data-model.md/tasks.md): ghi chú trỏ sang 011 ở `getAllQuestions` và modal chi tiết.
- [ ] **T014** `npm run build` + chạy checklist `quickstart.md` (2 tài khoản admin/giáo viên).
- [ ] **T015** Kiểm thử phân quyền (giáo viên không duyệt/sửa được) + hồi quy `/question-bank` & non-admin `/question-list`.

## Dependencies
- T003, T004 phụ thuộc T002.
- T005–T008 phụ thuộc T003/T004.
- T009 phụ thuộc T003 + tái dùng classifyQuestions/PATCH.
- T010 phụ thuộc T003. T011 phụ thuộc T003g.
- T014/T015 sau cùng.
