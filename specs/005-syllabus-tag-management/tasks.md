# Tasks: Quản lý Giáo trình (Syllabus/Topics) và Thẻ (Tags)

**Input**: Design documents from `/specs/005-syllabus-tag-management/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Các nhiệm vụ được gom nhóm theo User Story để hỗ trợ thực thi độc lập và kiểm thử từng bước.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (các tệp khác nhau, không có phụ thuộc lẫn nhau)
- **[Story]**: Mã định danh User Story (ví dụ: US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Thiết lập cơ bản cấu trúc định tuyến và menu điều hướng

- [x] T001 Thêm các biểu tượng cần thiết và định nghĩa route trong `src/components/layout/Sidebar.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cập nhật và bổ sung các API core ở backend, đây là các ràng buộc chặn việc thực thi ở frontend

**⚠️ CRITICAL**: Các User Story ở frontend chỉ có thể hoạt động sau khi hoàn tất các API nền tảng này.

- [x] T002 Cập nhật logic API DELETE để chặn xóa khi có liên kết trong `src/app/api/topics/[id]/route.ts`
- [x] T003 [P] Tạo API mới lấy danh sách thực thể liên quan khi xóa trong `src/app/api/topics/[id]/related/route.ts`
- [x] T004 [P] Tạo API mới hỗ trợ chuyển câu hỏi hàng loạt trong `src/app/api/topics/[id]/transfer/route.ts`

**Checkpoint**: Foundation ready - có thể bắt đầu xây dựng giao diện người dùng.

---

## Phase 3: User Story 1 - Quản lý Cây Chủ đề Học thuật (Priority: P1) 🎯 MVP

**Goal**: Giao diện trực quan cho phép xem, tạo mới, chỉnh sửa, kéo thả di chuyển vị trí các chủ đề.

**Independent Test**: Truy cập `/topics`, tạo chủ đề mới, kéo thả thay đổi vị trí, và chỉnh sửa thông tin thành công.

### Implementation for User Story 1

- [x] T005 [P] [US1] Xây dựng các hàm gọi API cho topics trong `src/services/topics.ts`
- [x] T006 [US1] Tạo thành phần node cây chủ đề đệ quy hỗ trợ đóng/mở rộng trong `src/components/ui/topic-tree-node.tsx`
- [x] T007 [US1] Tạo panel hiển thị chi tiết và form chỉnh sửa chủ đề trong `src/components/ui/topic-details-panel.tsx`
- [x] T008 [US1] Xây dựng giao diện trang chủ quản lý cây chủ đề chính tại `src/app/(main)/topics/page.tsx`

**Checkpoint**: Quản lý cây chủ đề hoạt động độc lập và hoàn chỉnh.

---

## Phase 4: User Story 2 - Quản lý Danh mục Thẻ (Priority: P1)

**Goal**: Giao diện CRUD danh sách thẻ tag phân loại theo Category.

**Independent Test**: Truy cập `/tags`, tìm kiếm, tạo mới và xóa tag thành công.

### Implementation for User Story 2

- [x] T009 [P] [US2] Xây dựng các hàm gọi API cho tags trong `src/services/tags.ts`
- [x] T010 [US2] Tạo bảng hiển thị danh sách tag và modal form tạo/sửa tag trong `src/components/ui/tag-management-modal.tsx`
- [x] T011 [US2] Xây dựng giao diện trang chủ quản lý thẻ tag tại `src/app/(main)/tags/page.tsx`

**Checkpoint**: Hệ thống quản lý thẻ tag hoạt động độc lập và hoàn chỉnh.

---

## Phase 5: User Story 3 - Xử lý Ràng buộc Khi Xóa (Priority: P2)

**Goal**: Hiển thị popup cảnh báo chặn xóa và giao diện chuyển đổi câu hỏi hàng loạt sang chủ đề khác.

**Independent Test**: Nhấp xóa chủ đề có liên kết, popup hiện cảnh báo chặn và danh sách câu hỏi, thực hiện chuyển đổi thành công rồi xóa chủ đề cũ.

### Tests for User Story 3

- [x] T012 [P] [US3] Viết kịch bản kiểm thử tự động API chặn xóa và bulk transfer trong `tests/test-delete-restrictions.ts`

### Implementation for User Story 3

- [x] T013 [US3] Thiết kế modal hiển thị câu hỏi liên quan và chọn chủ đề đích chuyển đổi trong `src/components/ui/topic-delete-transfer-modal.tsx`
- [x] T014 [US3] Tích hợp modal cảnh báo xóa/chuyển đổi vào trang quản lý cây chủ đề chính `src/app/(main)/topics/page.tsx`

**Checkpoint**: Hoàn tất cơ chế xóa an toàn và chuyển đổi hàng loạt.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tối ưu hóa, kiểm thử chất lượng và tài liệu hóa

- [x] T015 Chạy kiểm thử tự động bằng lệnh `npx tsx tests/test-delete-restrictions.ts`
- [x] T016 Tiến hành chạy thử nghiệm thủ công theo các kịch bản trong `specs/005-syllabus-tag-management/quickstart.md`
- [x] T017 [P] Cập nhật tài liệu bàn giao trong `specs/005-syllabus-tag-management/walkthrough.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** và **Foundational (Phase 2)**: Bắt buộc hoàn thành trước khi chuyển sang các User Story.
- **User Story 1 & 2**: Có thể chạy song song độc lập.
- **User Story 3**: Cần hoàn tất nền tảng API ở Phase 2 và giao diện cây chủ đề ở Phase 3.

---

## Parallel Example: Setup & Foundation

```bash
# Launch API foundational files in parallel:
Task: "T003 Tạo API mới lấy danh sách thực thể liên quan khi xóa trong src/app/api/topics/[id]/related/route.ts"
Task: "T004 Tạo API mới hỗ trợ chuyển câu hỏi hàng loạt trong src/app/api/topics/[id]/transfer/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Thiết lập Sidebar (`T001`).
2. Triển khai API nền tảng cho chặn xóa và các API phụ trợ (`T002`, `T003`, `T004`).
3. Hoàn tất giao diện CRUD Cây chủ đề (`US1`) và Thẻ tag (`US2`).
4. Kiểm thử độc lập phần giao diện CRUD.

### Incremental Delivery

1. Cung cấp tính năng quản lý cây chủ đề và tags cơ bản.
2. Tích hợp thêm cơ chế hiển thị cảnh báo và chuyển đổi câu hỏi hàng loạt (`US3`).
3. Tối ưu hiệu ứng và hoàn thiện tài liệu (`Phase 6`).
