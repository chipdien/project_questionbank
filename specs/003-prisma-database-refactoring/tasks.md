# Tasks: Tái cấu trúc kết nối cơ sở dữ liệu với Prisma

**Input**: Design documents from `/specs/003-prisma-database-refactoring/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Các tác vụ được phân nhóm theo User Story để đảm bảo tính độc lập khi triển khai và kiểm thử.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể thực hiện song song (ở các tệp tin khác nhau, không có phụ thuộc trực tiếp).
- **[Story]**: Đánh dấu User Story mà task đó phục vụ (ví dụ: US1, US2, US3).
- Các mô tả task phải chứa đường dẫn tệp tin chính xác.

---

## Phase 1: Setup (Hạ tầng dùng chung)

**Goal**: Khởi tạo cấu trúc dự án và các helpers dùng chung cho Prisma.

- [x] T001 Chạy sinh Prisma Client cục bộ: `npm run prisma:generate`
- [x] T002 [P] Tạo helper serialize BigInt an sau trong `src/lib/utils/serialization.ts`

---

## Phase 2: Foundational (Rào cản/Prerequisites bắt buộc)

**Goal**: Thiết lập kết nối Singleton cho Prisma và cấu trúc xử lý kết nối.

**⚠️ CRITICAL**: Các User Story chỉ có thể được triển khai sau khi pha này hoàn tất thành công.

- [x] T003 Thay thế module kết nối CSDL và xuất export Prisma Client singleton trong `src/lib/db/index.ts`
- [x] T004 Kiểm tra và cấu hình biến môi trường kết nối CSDL trong tệp `.env`

**Checkpoint**: Nền tảng kết nối sẵn sàng - có thể bắt đầu chuyển đổi các query nghiệp vụ.

---

## Phase 3: User Story 1 - Quản lý độ khó câu hỏi (Priority: P1) 🎯 MVP

**Goal**: Thay thế toàn bộ truy vấn trong action quản lý độ khó (`difficulty.ts`) sang Prisma Fluent API.

**Independent Test**: Truy cập trang cấu hình độ khó, thêm/sửa/xóa các mức độ khó và kiểm tra tính toàn vẹn dữ liệu trong database.

### Implementation for User Story 1

- [x] T005 [US1] Chuyển đổi truy vấn lấy danh sách độ khó `getDifficulties()` trong `src/actions/difficulty.ts` sang dùng `prisma.lms_difficulties.findMany`
- [x] T006 [US1] Chuyển đổi hàm thêm độ khó `addDifficulty()` trong `src/actions/difficulty.ts` sang dùng `prisma.lms_difficulties.create`
- [x] T007 [US1] Chuyển đổi hàm cập nhật độ khó `updateDifficulty()` trong `src/actions/difficulty.ts` dùng `$transaction` của Prisma để cập nhật bảng `lms_difficulties` và `lms_questions`
- [x] T008 [US1] Chuyển đổi hàm xóa độ khó `deleteDifficulty()` trong `src/actions/difficulty.ts` dùng `$transaction` của Prisma để cập nhật `lms_questions` và xóa bản ghi `lms_difficulties`

**Checkpoint**: User Story 1 hoạt động độc lập và hoàn toàn qua Prisma ORM.

---

## Phase 4: User Story 2 - Ingest tài liệu và bóc tách câu hỏi (Priority: P2)

**Goal**: Cập nhật dịch vụ bóc tách tài liệu tự động và lưu trữ đa bảng sử dụng Transaction của Prisma.

**Independent Test**: Tải lên tài liệu mẫu qua UI Ingest, kiểm tra tiến trình bóc tách và ghi dữ liệu đa bảng trong database.

### Implementation for User Story 2

- [x] T009 [US2] Chuyển đổi hàm khởi tạo task `createTask()` trong `src/lib/services/ingest.ts` sang dùng `prisma.lms_processing_tasks.create`
- [x] T010 [US2] Chuyển đổi hàm check trùng lặp `checkDuplicatesByHash()` trong `src/lib/services/ingest.ts` sang dùng `prisma.lms_processing_tasks.findMany` kết hợp include hoặc query quan hệ
- [x] T011 [US2] Chuyển đổi hàm cập nhật status task `updateTaskStatus()` trong `src/lib/services/ingest.ts` sang dùng `prisma.lms_processing_tasks.update`
- [x] T012 [US2] Chuyển đổi hàm lưu trữ đa bảng `saveToDatabase()` trong `src/lib/services/ingest.ts` sang dùng `prisma.$transaction` để ghi đồng thời dữ liệu vào `lms_documents`, `lms_questions`, `lms_options`, và `lms_questions_documents`

**Checkpoint**: Luồng bóc tách dữ liệu hoạt động ổn định, rollback chính xác qua Prisma Transaction.

---

## Phase 5: User Story 3 - Tái sử dụng tài liệu cho User khác (Priority: P3)

**Goal**: Refactor nghiệp vụ nhân bản dữ liệu và liên kết đề thi sang Prisma Client.

**Independent Test**: Thực hiện clone đề thi có sẵn từ giáo viên khác và xác minh tài liệu mới được tạo dưới tài khoản hiện tại.

### Implementation for User Story 3

- [x] T013 [US3] Chuyển đổi hàm nhân bản `reuseDocument()` trong `src/lib/services/ingest.ts` sang dùng `prisma.$transaction` để clone dữ liệu `lms_documents` và `lms_questions_documents`

**Checkpoint**: Nghiệp vụ nhân bản đề thi hoạt động hoàn hảo và lưu trữ đúng logic qua Prisma.

---

## Phase 6: Chuyển đổi các module truy vấn còn lại

**Goal**: Refactor toàn bộ các truy vấn SQL thô còn lại trong mã nguồn sang Prisma Client.

- [x] T014 [P] Refactor các truy vấn CSDL trong `src/actions/ai-classify.ts` sang dùng Prisma ORM API
- [x] T015 [P] Refactor các truy vấn CSDL trong `src/actions/auth.ts` và `src/lib/utils/auth-utils.ts` sang dùng Prisma ORM API
- [x] T016 [P] Refactor các truy vấn CSDL trong `src/actions/question.ts` và `src/actions/collection.ts` sang dùng Prisma ORM API
- [x] T017 [P] Refactor các truy vấn SQL thô trong các API Routes tại `src/app/api/documentcustom/` và các trang Next.js Pages `src/app/(main)/page.tsx`, `src/app/(main)/question-bank/page.tsx` sang Prisma Client

---

## Phase 7: Polish & Kiểm tra chéo

**Goal**: Tối ưu hóa serialization, xử lý lỗi, kiểm thử hiệu năng và xác thực.

- [x] T018 Đảm bảo tất cả các API Routes và Server Actions bọc dữ liệu trả về với helper `serializeBigInt` để tránh lỗi serialization JSON
- [x] T019 Chạy build dự án: `npm run build` để kiểm tra lỗi biên dịch TypeScript
- [x] T020 Thực hiện kiểm thử thủ công theo kịch bản trong `quickstart.md` để xác nhận toàn bộ tính năng hoạt động trơn tru

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** -> **Foundational (Phase 2)** -> **User Stories (Phases 3, 4, 5)** -> **Polish (Phase 7)**.
- Giai đoạn Setup và Foundational là bắt buộc hoàn thành trước khi bắt đầu bất kỳ nghiệp vụ nào khác.
- Các User Stories và Phase 6 có thể thực hiện song song sau khi hoàn thành Phase 2.

### Parallel Opportunities

- T014, T015, T016, T017 có thể chạy song song bởi các lập trình viên khác nhau do nằm ở các file module tách biệt.
