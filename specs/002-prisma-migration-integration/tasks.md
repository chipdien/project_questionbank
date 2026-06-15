# Tasks: Tích hợp Prisma ORM và Hệ thống Migration

**Input**: Design documents from `/specs/002-prisma-migration-integration/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Script test được viết trong `tests/` để kiểm tra kết nối qua tsx.

**Organization**: Các nhiệm vụ được gom nhóm theo từng phân đoạn cài đặt và User Story để dễ dàng thực hiện và kiểm thử độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (các tệp tin khác nhau, không có ràng buộc phụ thuộc)
- **[Story]**: Đánh dấu User Story mà nhiệm vụ đó phục vụ (ví dụ: US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Cài đặt các thư viện cần thiết cho Prisma ORM

- [x] T001 Cài đặt dependencies `prisma` (devDependencies) và `@prisma/client` (dependencies) vào `package.json`
- [x] T002 Cấu hình scripts chạy Prisma trong `package.json` (ví dụ `prisma:generate`, `prisma:migrate`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cấu hình cơ sở hạ tầng Prisma bắt buộc hoàn thành trước khi triển khai các luồng chính

- [x] T003 Khởi tạo thư mục Prisma bằng lệnh `npx prisma init` để sinh file `schema.prisma`
- [x] T004 Cấu hình chuỗi kết nối `DATABASE_URL` trong tệp `.env` dựa trên cấu hình database MySQL hiện tại
- [x] T005 [P] Xây dựng tệp cấu hình thực thể `prisma/schema.prisma` ánh xạ đầy đủ 22 bảng từ `vietelite_qb.sql`
- [x] T006 [P] Tạo và cấu hình thực thể Prisma Client dạng Singleton tại `src/lib/db/prisma.ts` để chống rò rỉ kết nối

**Checkpoint**: Nền tảng cấu hình đã sẵn sàng - có thể tiến hành tích hợp và migrate database.

---

## Phase 3: User Story 1 - Khởi tạo và Đồng bộ Cơ sở dữ liệu (Priority: P1) 🎯 MVP

**Goal**: Khởi tạo và chạy bản ghi migration đầu tiên (Baselining) trên VPS aaPanel mà không làm mất dữ liệu hiện có.

**Independent Test**: Chạy lệnh tạo migration dev và sinh thành công cấu trúc bảng trên một database local trống.

### Implementation for User Story 1

- [x] T007 [US1] Tạo bản ghi migration khởi đầu bằng lệnh: `npx prisma migrate dev --name init --create-only`
- [x] T008 [US1] Đánh dấu bản ghi migration đã hoàn thành trên database có sẵn bằng lệnh: `npx prisma migrate resolve --applied <migration_init_folder>`
- [x] T009 [US1] Biên dịch ra các kiểu dữ liệu Type-safe client bằng lệnh: `npx prisma generate`

**Checkpoint**: Cơ sở dữ liệu và Prisma Client đã được đồng bộ hóa thành công và sẵn sàng để lập trình viên sử dụng.

---

## Phase 4: User Story 2 - Sử dụng Prisma Client để truy vấn type-safe (Priority: P2)

**Goal**: Xác minh và kiểm thử khả năng đọc ghi dữ liệu an toàn về mặt kiểu (Type-safe) qua Prisma Client.

**Independent Test**: Chạy script test kết nối và lấy thành công dữ liệu từ bảng `lms_syllabus`.

### Tests for User Story 2

- [x] T010 [P] [US2] Viết tệp script test nhanh tại `tests/test-prisma.ts` để truy vấn thử bảng `lms_syllabus` bằng Prisma Client

### Implementation for User Story 2

- [x] T011 [US2] Chạy thử nghiệm script test bằng lệnh `npx tsx tests/test-prisma.ts`
- [x] T012 [US2] Sửa lỗi biên dịch TypeScript nếu có phát sinh khi ánh xạ kiểu dữ liệu `BigInt` sang JSON

**Checkpoint**: Prisma Client truy vấn Type-safe hoạt động chính xác.

---

## Phase 5: User Story 3 - Duy trì khả năng chạy SQL thuần song song (Priority: P3)

**Goal**: Đảm bảo helper `mysql2` cũ không bị ảnh hưởng và chạy song song đồng thời với Prisma Client mới.

**Independent Test**: Chạy kiểm thử hệ thống hiện tại trên local dev server và xác nhận không có lỗi xảy ra ở các trang cũ.

### Implementation for User Story 3

- [x] T013 [US3] Kiểm tra tệp [src/lib/db/index.ts](file:///Volumes/DATA/workspace/vietelite_questionbank/src/lib/db/index.ts) để đảm bảo không bị xung đột kết nối khi Prisma cùng hoạt động
- [x] T014 [US3] Khởi chạy dev server `npm run dev` để kiểm tra các API cũ sử dụng SQL thuần vẫn hoạt động bình thường

**Checkpoint**: Hai kết nối cơ sở dữ liệu hoạt động song song mượt mà.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện tài liệu hướng dẫn và dọn dẹp dự án

- [x] T015 Cập nhật tài liệu [README.md](file:///Volumes/DATA/workspace/vietelite_questionbank/README.md) hướng dẫn lập trình viên mới cách setup và chạy migrations
- [x] T016 Chạy toàn bộ các bước kiểm thử trong [quickstart.md](file:///Volumes/DATA/workspace/vietelite_questionbank/specs/002-prisma-migration-integration/quickstart.md) để nghiệm thu tính năng

---

## Dependencies & Execution Order

### Phase Dependencies

* **Setup (Phase 1)**: Có thể chạy ngay.
* **Foundational (Phase 2)**: Phụ thuộc vào Phase 1 hoàn thành.
* **User Story 1 (Phase 3)**: Phụ thuộc vào Phase 2 hoàn thành.
* **User Story 2 (Phase 4)** và **User Story 3 (Phase 5)**: Phụ thuộc vào User Story 1 hoàn thành.
* **Polish (Phase 6)**: Phụ thuộc vào tất cả các User Stories hoàn thành.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Hoàn thành cài đặt thư viện và file `schema.prisma`.
2. Tạo bản ghi migration dev `init` thành công.
3. Chạy `prisma generate` tạo client types.
4. **Nghiệm thu phần 1:** Xác minh client types được tạo lập mà không có lỗi.
