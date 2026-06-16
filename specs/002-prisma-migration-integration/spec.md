# Feature Specification: Tích hợp Prisma ORM và Hệ thống Migration (Prisma ORM & Migration Integration)

**Feature Branch**: `002-prisma-migration-integration`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "cần chuyển đổi sang prisma và data migrations để tiện cho việc nâng cấp hệ thống sau này. hãy phân tích vietelite_qb.sql"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Khởi tạo và Đồng bộ Cơ sở dữ liệu (Priority: P1)

Là lập trình viên phát triển dự án, tôi muốn sử dụng công cụ CLI của Prisma để tự động đồng bộ hóa cấu trúc bảng từ mã nguồn (`schema.prisma`) vào cơ sở dữ liệu MySQL một cách nhất quán trên cả môi trường local và môi trường production.

**Why this priority**: Đây là nền tảng cốt lõi của hệ thống migration, đảm bảo cấu trúc database của tất cả môi trường giống hệt nhau mà không cần chạy các file sql thủ công.

**Independent Test**: Lập trình viên chạy lệnh migration của Prisma trên một database trống, hệ thống tự động khởi tạo đầy đủ 22 bảng tương thích 100% với cấu trúc cũ trong `vietelite_qb.sql`.

**Acceptance Scenarios**:

1. **Given** Lập trình viên thiết lập chuỗi kết nối `DATABASE_URL` trong `.env`, **When** Chạy lệnh `npx prisma migrate dev`, **Then** Hệ thống tạo thành công các bảng trong database và ghi nhận file migration lịch sử.
2. **Given** Cơ sở dữ liệu hiện tại đã có sẵn dữ liệu cũ (production), **When** Thực hiện chạy migration lần đầu tiên (Baselining), **Then** Hệ thống ghi nhận trạng thái hiện tại là hợp lệ và không xóa/làm mất dữ liệu cũ của khách hàng.

---

### User Story 2 - Sử dụng Prisma Client để truy vấn type-safe (Priority: P2)

Là lập trình viên, tôi muốn sử dụng Prisma Client để thực hiện các câu lệnh truy vấn dữ liệu (CRUD) một cách an toàn về mặt kiểu dữ liệu (type-safe) và tự động gợi ý code (IntelliSense) trong VS Code nhằm giảm thiểu tối đa các lỗi cú pháp SQL.

**Why this priority**: Nâng cao hiệu suất viết code và giảm thiểu lỗi runtime liên quan đến việc viết sai tên cột hoặc kiểu dữ liệu.

**Independent Test**: Gọi hàm truy vấn danh sách `lms_syllabus` bằng Prisma Client và nhận về dữ liệu được định kiểu tĩnh (strongly typed) trong TypeScript.

**Acceptance Scenarios**:

1. **Given** Đã sinh thành công Prisma Client, **When** Lập trình viên gọi `prisma.lms_syllabus.findMany()`, **Then** IDE gợi ý đầy đủ các trường của bảng `lms_syllabus` (`id`, `title`, `grade`, `domain_id`...) và trả về đúng kiểu dữ liệu.

---

### User Story 3 - Duy trì khả năng chạy SQL thuần song song (Gradual Migration) (Priority: P3)

Là lập trình viên, tôi muốn có khả năng chạy các câu truy vấn SQL thuần (raw query) thông qua Prisma hoặc helper cũ để có thể chuyển đổi dần dần (từng trang/từng API) từ thư viện `mysql2` cũ sang Prisma mà không làm gián đoạn hệ thống đang chạy.

**Why this priority**: Cho phép di chuyển mã nguồn từng phần một cách an toàn (Gradual Migration), tránh rủi ro khi thay đổi quá nhiều code cùng lúc.

**Independent Test**: Gọi một câu lệnh SQL phức tạp có sẵn bằng helper cũ hoặc thông qua `prisma.$queryRaw` và đảm bảo kết quả trả về khớp 100% với trước đây.

**Acceptance Scenarios**:

1. **Given** Hệ thống đang sử dụng helper `query()` cũ ở nhiều tệp tin, **When** Tích hợp Prisma, **Then** Các chức năng cũ chạy SQL thuần vẫn hoạt động bình thường mà không cần chỉnh sửa đồng loạt ngay lập tức.

---

### Edge Cases

- **Xử lý các bảng liên kết nhiều - nhiều (Many-to-Many joint tables):** Một số bảng liên kết trong `vietelite_qb.sql` như `lms_questions_lessons` hoặc `lms_topics_questions` sử dụng khóa chính hỗn hợp (`PRIMARY KEY (question_id, lesson_id)`). Prisma cần nhận diện chính xác các quan hệ này để tự động sinh các mối quan hệ ảo tương ứng trên Client.
- **Đồng bộ hóa kiểu dữ liệu datetime:** MySQL sử dụng `datetime(3)` cho một số trường như `created_at` trong `lms_syllabus`. Prisma Schema phải ánh xạ chính xác sang loại `@db.DateTime(3)` để tránh sai lệch dữ liệu khi đọc ghi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cài đặt và cấu hình thành công các thư viện `prisma` (devDependencies) và `@prisma/client` (dependencies).
- **FR-002**: Lập trình viên MUST xây dựng tệp `prisma/schema.prisma` ánh xạ đầy đủ cấu trúc của 22 bảng từ tệp `vietelite_qb.sql` bao gồm các khóa ngoại, chỉ mục (Index) và quan hệ.
- **FR-003**: Hệ thống MUST thiết lập một tệp tin duy nhất khởi tạo thực thể Prisma Client (`prisma/client.ts` hoặc tương đương) dưới dạng Singleton để tránh rò rỉ kết nối (Connection Leak) trong môi trường Next.js Hot Reload.
- **FR-004**: Hệ thống MUST cung cấp cơ chế Baseline Migration cho các môi trường đã có sẵn dữ liệu để tránh chạy đè làm mất dữ liệu.
- **FR-005**: Mọi thay đổi cấu trúc bảng sau này MUST được thực hiện thông qua tệp `schema.prisma` và chạy lệnh `prisma migrate` để đồng bộ.

### Key Entities *(include if feature involves data)*

Prisma sẽ ánh xạ 22 bảng sau thành các Model trong `schema.prisma`:
- **lms_users**: Quản lý tài khoản.
- **lms_syllabus**: Khung chương trình.
- **lms_topics**: Chuyên đề.
- **lms_lessons**: Bài học.
- **lms_lessons_sessions**: Buổi học.
- **lms_questions**: Ngân hàng câu hỏi.
- **lms_options**: Các lựa chọn câu hỏi trắc nghiệm.
- **lms_difficulties**: Mức độ khó của câu hỏi.
- **lms_documents** & **lms_documents_custom**: Quản lý tài liệu đề thi.
- **lms_exams**: Đề thi kiểm tra.
- Các bảng liên kết: `lms_questions_lessons`, `lms_topics_questions`, `lms_questions_exams`, `lms_questions_documents`, `lms_questions_collections`, `lms_documents_classes`, `lms_documents_sessions`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quá trình khởi tạo Prisma Client thành công, không phát sinh bất kỳ lỗi biên dịch TypeScript nào trên toàn bộ dự án.
- **SC-002**: 100% cấu trúc các bảng cũ được ánh xạ đúng kiểu dữ liệu, các quan hệ khóa ngoại (Foreign Keys) được bảo toàn nguyên vẹn trên cơ sở dữ liệu.
- **SC-003**: Thao tác tạo migration mới thông qua lệnh `npx prisma migrate dev` diễn ra trong thời gian dưới 10 giây.

## Assumptions

- Thông tin kết nối cơ sở dữ liệu cũ trong tệp `.env` (`DB_HOST`, `DB_PORT`...) sẽ được tái sử dụng để cấu hình biến `DATABASE_URL` cho Prisma.
- Cơ sở dữ liệu MySQL trên môi trường aaPanel đang chạy phiên bản 8.0.x (tương thích hoàn toàn với Prisma).
