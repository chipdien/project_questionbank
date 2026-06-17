# Tasks: Trang Danh sách Câu hỏi (Question List)

**Feature**: `010-page-list` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Quy ước: `[P]` = có thể làm song song (file độc lập). Thứ tự ưu tiên từ trên xuống.

## Phase 1 — Tầng dữ liệu (Backend)

- [ ] **T001** Tạo helper `src/lib/services/question-filters.ts`: `resolveTopicQuestionIds(topicIds)` (đệ quy theo `path`) và `filterByTags(questionIds, tagIds)` (OR trong category, AND giữa category). Trích logic từ `getLibraryQuestions`, KHÔNG sửa bản gốc.
- [ ] **T002** Tạo `src/actions/question-list.ts` với `getAllQuestions(page=1, pageSize=50, filters)`:
  - [ ] T002a Phân quyền: admin thấy tất cả; non-admin `OR[public='1', public null, created_by_id, owned_by_id, teacher_owned_by_id]`.
  - [ ] T002b Ẩn câu con `sub` (`complex != 'sub'` hoặc null).
  - [ ] T002c Lọc `grades`, `questionTypes`, `keyword` (statement/content).
  - [ ] T002d Lọc topic & tag qua helper (T001).
  - [ ] T002e Bộ lọc `unclassified`: tính `hasBoth` (giao distinct topic-questions ∩ tag-questions) → `notIn`.
  - [ ] T002f `count` + `findMany` (orderBy id desc, skip/take 50), nạp topics/tags/màu độ khó/tên người tạo, `serializeBigInt`, set `isClassified`.

## Phase 2 — Điều hướng

- [ ] **T003** Sửa `src/components/layout/Sidebar.tsx`: thêm `{ label: 'Danh sách câu hỏi', href: '/question-list' }` vào children của "Xử lý tài liệu"; cập nhật điều kiện auto-mở submenu để bao gồm `/question-list`. (Lưu ý: chọn icon từ lucide-react.)

## Phase 3 — Giao diện

- [ ] **T004** Tạo `src/app/(main)/question-list/page.tsx` (server): nạp `difficulties`, `tags` (gom theo category), `topics`, `isAdmin`, `currentUserId`; render `QuestionListManager`. (Tham khảo cách nạp dữ liệu ở `question-bank/page.tsx`.)
- [ ] **T005** Tạo `QuestionListManager.tsx` (client): state filter + page, đồng bộ URL query params, gọi `getAllQuestions`, reset page=1 khi đổi filter, truyền props xuống header + table.
- [ ] **T006** `[P]` Tạo `QuestionListFilterHeader.tsx`: ô search (debounce), `AppSelect` khối lớp & hình thức, `topic-tree-select` chủ đề, ô tag tổng hợp gom category, toggle "Chỉ hiện chưa phân loại", nút "Xóa bộ lọc". Layout header ngang responsive.
- [ ] **T007** `[P]` Tạo `QuestionListTable.tsx`: bảng read-only các cột theo FR-011 + cột Người tạo, Ngày tạo; badge độ khó (`AppBadge`); nút "Xem chi tiết" mở `QuestionModal` (read-only); empty state; phân trang 50/trang ở chân bảng.

## Phase 4 — Hoàn thiện & Kiểm thử

- [ ] **T008** Xử lý hiển thị nội dung markdown/math (tái dùng util `getQuestionDisplayContent`/`cleanMathpixData` như các bảng khác).
- [ ] **T009** Chạy checklist `quickstart.md`: phân quyền, lọc, tìm kiếm, URL state, edge cases.
- [ ] **T010** Kiểm tra hồi quy: `/question-bank` và `getLibraryQuestions` không đổi hành vi.
- [ ] **T011** Rà soát hiệu năng `getAllQuestions` với bộ lọc nặng (mục tiêu < 500ms).

## Dependencies

- T002 phụ thuộc T001.
- T004 phụ thuộc T002.
- T005 phụ thuộc T004; T006, T007 phụ thuộc T005 (nhận props).
- T009–T011 sau khi T003–T008 xong.

## Cập nhật bởi 011-question-requests
- T7 (`QuestionListTable`): dùng `QuestionDetailModal` thay `QuestionModal`; thêm badge "N yêu cầu".
- `getAllQuestions`: mở rộng `prioritizeRequests` + `pendingRequestCount`.
