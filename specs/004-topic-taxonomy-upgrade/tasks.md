# Tasks: Nâng Cấp Hệ Thống Phân Loại Chủ Đề Và Gắn Thẻ Câu Hỏi

**Input**: Design documents từ `/specs/004-topic-taxonomy-upgrade/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Các nhiệm vụ được gom nhóm theo User Story để đảm bảo tính độc lập triển khai và kiểm thử của từng Story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (các file khác nhau, không có phụ thuộc)
- **[Story]**: Thuộc User Story nào (ví dụ: US1, US2, US3)
- Có đường dẫn file cụ thể trong phần mô tả.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Khởi tạo cấu trúc dự án và chuẩn bị môi trường phát triển

- [x] T001 Tạo thư mục chứa test script tại `tests/`
- [x] T002 Cấu hình môi trường local kết nối tới cơ sở dữ liệu kiểm thử trong `.env.local`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Chuẩn bị Schema Database và Migrations bằng Prisma ORM.

**⚠️ CRITICAL**: Không thể bắt đầu thực hiện các User Story khác khi Phase này chưa hoàn thành.

- [x] T003 Cập nhật schema Prisma cho bảng `lms_topics` tự liên kết, bảng tag `lms_tags`, và bảng map Nhiều-Nhiều `lms_questions_tags` trong `prisma/schema.prisma`
- [x] T004 Tạo và chạy MySQL migration để apply các thay đổi schema vào Database qua lệnh `npx prisma migrate dev --name upgrade_topic_taxonomy` (Đã chạy qua db push thành công do giới hạn quyền tạo shadow db)
- [x] T005 [P] Sinh lại Prisma Client bằng lệnh `npx prisma generate` (Tự động chạy sau db push)

**Checkpoint**: Cơ sở dữ liệu và Prisma Client đã sẵn sàng.

---

## Phase 3: User Story 1 - Quản lý cấu trúc phân cấp Chủ đề học thuật (Priority: P1) 🎯 MVP

**Goal**: Cho phép quản lý cây thư mục chủ đề đệ quy không giới hạn cấp độ và tính toán Materialized Path.

**Independent Test**: Chạy script test tạo node cha, node con và kiểm tra đường dẫn (path) tự động cập nhật chính xác.

### Implementation for User Story 1

- [x] T006 [P] [US1] Tạo file helper xử lý tính toán và cập nhật đệ quy Materialized Path khi thay đổi parent_id tại `src/lib/materialized-path.ts`
- [x] T007 [US1] Viết API endpoint GET để lấy cây chủ đề đệ quy tại `src/app/api/topics/route.ts`
- [x] T008 [US1] Viết API endpoint POST để tạo mới chủ đề và tự động tính toán sinh path tại `src/app/api/topics/route.ts`
- [x] T009 [US1] Viết API endpoint PUT/PATCH để cập nhật nút cha của chủ đề và gọi helper đệ quy cập nhật toàn bộ nhánh con tại `src/app/api/topics/[id]/route.ts`
- [x] T010 [P] [US1] Tạo file kiểm thử tự động xác thực materialized path và lưu tại `tests/test-taxonomy.ts` (Đã chạy kiểm thử thành công và vượt qua)

**Checkpoint**: User Story 1 hoàn thành độc lập. Cây thư mục đệ quy hoạt động và cập nhật path chính xác.

---

## Phase 4: User Story 2 - Gắn thẻ (Tagging) đa chiều cho câu hỏi (Priority: P1)

**Goal**: Tạo tag theo nhóm và gán/gỡ bỏ tag cho câu hỏi.

**Independent Test**: Tạo tag mới, gán vào câu hỏi hiện có và truy xuất thành công.

### Implementation for User Story 2

- [x] T011 [US1] Viết API endpoint POST để tạo tag mới và phân nhóm category tại `src/app/api/tags/route.ts`
- [x] T012 [US1] Viết API endpoint GET để lấy danh sách tag lọc theo category tại `src/app/api/tags/route.ts`
- [x] T013 [US2] Viết API endpoint POST/DELETE để gắn hoặc gỡ bỏ tag khỏi một câu hỏi tại `src/app/api/questions/[id]/tags/route.ts`
- [x] T014 [P] [US2] Tạo file kiểm thử liên kết tag vào câu hỏi tại `tests/test-tagging.ts` (Đã chạy kiểm thử thành công và vượt qua)

**Checkpoint**: User Story 2 hoàn thành độc lập. Giáo viên có thể gắn thẻ tag cho câu hỏi thành công.

---

## Phase 5: User Story 3 - Tìm kiếm và Lọc câu hỏi nâng cao (Priority: P2)

**Goal**: Tìm kiếm câu hỏi kết hợp chủ đề đệ quy (con cháu) và thẻ tag.

**Independent Test**: Chạy API lọc theo chủ đề cha + tag và kiểm tra kết quả trả về chính xác trong thời gian tối ưu.

### Implementation for User Story 3

- [x] T015 [US3] Viết API endpoint GET tìm kiếm câu hỏi có bộ lọc chủ đề (sử dụng toán tử `startsWith` trên path) và kết hợp danh sách tag tại `src/app/api/questions/search/route.ts`
- [x] T016 [P] [US3] Tạo script test kiểm thử hiệu năng truy vấn lọc câu hỏi tại `tests/test-search-performance.ts` (Đã chạy kiểm thử thành công và vượt qua với kết quả truy vấn 24ms)

**Checkpoint**: Hệ thống lọc câu hỏi đệ quy tích hợp tag hoạt động chính xác.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Dọn dẹp code, tối ưu index và chạy kịch bản nghiệm thu cuối cùng.

- [x] T017 Viết script di chuyển dữ liệu cũ (Syllabus/Topic/Lesson cũ) sang cấu trúc đệ quy mới trong `src/scripts/migrate-old-data.ts` (Đã chạy di chuyển thành công 100% dữ liệu cũ)
- [x] T018 Thực hiện tối ưu hóa chỉ mục (Index) MySQL cho trường `path` và `parent_id` trong `prisma/schema.prisma` (Đã index thành công qua db push)
- [x] T019 Chạy toàn bộ các test script đã viết trong thư mục `tests/` để đảm bảo không có lỗi hồi quy (Đã chạy pass toàn bộ test suite)
- [x] T020 Cập nhật tài liệu hướng dẫn vận hành và cấu trúc API mới trong `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Bắt đầu ngay lập tức.
- **Foundational (Phase 2)**: Phụ thuộc vào Setup, chặn việc thực hiện các User Stories.
- **User Stories (Phase 3+)**: Phụ thuộc vào Foundational. Các User Story có thể thực hiện tuần tự theo thứ tự ưu tiên (US1 ➔ US2 ➔ US3).
- **Polish (Phase 6)**: Phụ thuộc vào tất cả các User Story hoàn thành.

### Parallel Opportunities

- Các API của Tagging (US2) và phân cấp học thuật (US1) độc lập về mặt file nên các developer có thể lập trình song song sau khi Phase 2 (Foundational) hoàn thành.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Hoàn thành Setup & Foundational.
2. Thực hiện User Story 1 (Cây phân cấp học thuật).
3. Kiểm thử độc lập và nghiệm thu MVP.

---

## Notes
- Mọi nhiệm vụ đều đi kèm đường dẫn tệp cụ thể để dễ dàng định vị.
- Đảm bảo kiểm tra lỗi khi thực hiện thay đổi schema để tránh ảnh hưởng đến dữ liệu câu hỏi cũ của VietElite.
