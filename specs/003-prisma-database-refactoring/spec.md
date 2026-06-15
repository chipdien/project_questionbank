# Feature Specification: Refactoring Database Connection with Prisma

**Feature Branch**: `003-prisma-database-refactoring`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "refactor lại dự án để sửa đổi các kết nối đến cơ sở dữ liệu thông qua prisma"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quản lý độ khó câu hỏi (Priority: P1)

Người dùng (đặc biệt là Admin) thực hiện các thao tác lấy danh sách, thêm, sửa, xóa độ khó câu hỏi một cách bình thường. Mọi thay đổi dữ liệu đều được lưu trữ và đồng bộ hóa thành công qua database bằng Prisma.

**Why this priority**: Độ khó câu hỏi là cấu hình cơ bản được hiển thị và quản lý trong ngân hàng câu hỏi, có lượng tương tác thường xuyên và cấu trúc dữ liệu đơn giản nhất để kiểm chứng việc chuyển đổi sang Prisma.

**Independent Test**: Có thể kiểm tra độc lập bằng cách truy cập trang cấu hình độ khó, thực hiện các thao tác CRUD và kiểm tra dữ liệu thay đổi tương ứng trong CSDL.

**Acceptance Scenarios**:

1. **Given** Trang ngân hàng câu hỏi được tải, **When** người dùng xem danh sách độ khó, **Then** hệ thống truy vấn thành công danh sách từ CSDL qua Prisma Client và hiển thị đúng thứ tự.
2. **Given** Người dùng đăng nhập quyền Admin, **When** thực hiện thêm mới, cập nhật hoặc xóa độ khó, **Then** hệ thống thực thi câu lệnh ghi qua Prisma Client, đồng bộ hóa thành công các bản ghi liên quan (như cập nhật cột độ khó trong bảng câu hỏi lân cận).

---

### User Story 2 - Ingest tài liệu và lưu trữ câu hỏi tự động (Priority: P2)

Hệ thống cho phép tải lên tài liệu thô, phân tích câu hỏi bằng AI và lưu trữ thông tin có cấu trúc (tài liệu, câu hỏi, các tùy chọn đáp án) vào CSDL một cách an toàn thông qua cơ chế Transaction của Prisma.

**Why this priority**: Đây là luồng nghiệp vụ cốt lõi của ứng dụng (Question Bank). Dữ liệu được ghi vào nhiều bảng liên kết cùng lúc, cần tính toàn vẹn dữ liệu cực kỳ cao.

**Independent Test**: Tải lên một file văn bản thô qua UI Ingest, kiểm tra log xem quá trình lưu trữ qua transaction của Prisma có thành công hay rollback đúng cách khi gặp lỗi.

**Acceptance Scenarios**:

1. **Given** Dữ liệu câu hỏi đã được phân tích cấu trúc, **When** hệ thống gọi hàm lưu trữ, **Then** Prisma khởi tạo một transaction duy nhất để lưu document, danh sách questions, liên kết question-document và các options.
2. **Given** Quá trình lưu questions hoặc options bị lỗi giữa chừng, **When** transaction đang thực thi, **Then** Prisma tự động rollback toàn bộ dữ liệu đã ghi trước đó của document đó để tránh dữ liệu rác.

---

### User Story 3 - Tái sử dụng tài liệu cho User khác (Priority: P3)

Người dùng có thể clone/tái sử dụng các tài liệu và câu hỏi đã có sẵn của người khác về tài khoản của mình.

**Why this priority**: Tránh trùng lặp dữ liệu vật lý và tăng hiệu năng tạo đề/câu hỏi cho giáo viên.

**Independent Test**: Thực hiện bấm nút tái sử dụng một tài liệu có sẵn từ giáo viên khác và kiểm tra xem tài liệu mới được tạo có chứa đầy đủ câu hỏi liên kết giống hệt tài liệu cũ nhưng thuộc sở hữu của user hiện tại hay không.

**Acceptance Scenarios**:

1. **Given** Một tài liệu có sẵn ID nguồn, **When** người dùng chọn tái sử dụng, **Then** hệ thống nhân bản document mới và tạo hàng loạt bản ghi liên kết sang các câu hỏi cũ một cách nhanh chóng qua Prisma.

---

### Edge Cases

- **MySQL BigInt Serialization**: Các trường ID sử dụng kiểu `BigInt` (ví dụ `lms_questions.id`, `lms_documents.id`) khi được Prisma trả về dưới dạng JavaScript `BigInt` không thể serialize trực tiếp sang JSON trong Next.js Server Actions/API Routes. Hệ thống phải có giải pháp serialize tự động (ví dụ chuyển đổi sang string hoặc number an toàn).
- **Deadlocks & Connection Pool**: Khi thực thi transaction phức tạp hoặc nhiều kết nối đồng thời từ các serverless route của Next.js, Prisma Client cần giới hạn connection pool thích hợp và giải phóng kết nối nhanh để tránh cạn kiệt tài nguyên.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI thay thế hoàn toàn việc sử dụng thư viện `mysql2/promise` trực tiếp sang sử dụng Prisma Client cho tất cả các truy vấn dữ liệu.
- **FR-002**: Hệ thống PHẢI sử dụng Prisma Client duy nhất dạng singleton toàn cục (global client) để tránh rò rỉ kết nối (connection leaks) trong môi trường phát triển (Next.js hot reload).
- **FR-003**: Hệ thống PHẢI sử dụng cơ chế `$transaction` của Prisma cho tất cả các luồng ghi dữ liệu đồng thời vào nhiều bảng liên quan (như ingest tài liệu, nhân bản câu hỏi).
- **FR-004**: Hệ thống PHẢI xử lý kiểu dữ liệu `BigInt` trả về từ Prisma bằng cách chuyển đổi tự động sang `string` hoặc định dạng JSON-safe trước khi gửi qua Server Actions hoặc API Routes.
- **FR-005**: Hệ thống PHẢI truy vấn cơ sở dữ liệu hoàn toàn bằng API ORM Fluent của Prisma Client, tuyệt đối không được phép sử dụng `$queryRaw` hoặc `$executeRaw` của Prisma hay bất kỳ câu lệnh SQL thô nào khác.

### Key Entities

- **lms_users**: Đại diện cho tài khoản người dùng trong hệ thống.
- **lms_documents**: Tài liệu chứa các câu hỏi thô hoặc đã được cấu trúc hóa.
- **lms_questions**: Các câu hỏi trong ngân hàng câu hỏi.
- **lms_options**: Các lựa chọn đáp án cho câu hỏi trắc nghiệm.
- **lms_difficulties**: Cấu hình các độ khó cho câu hỏi.
- **lms_processing_tasks**: Lưu vết trạng thái xử lý/ingest tài liệu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% các kết nối và truy vấn CSDL trong thư mục `src/` được thực hiện qua Prisma Client, không còn sử dụng trực tiếp pool của `mysql2`.
- **SC-002**: Mọi API Routes và Server Actions hoạt động ổn định, không gặp lỗi `TypeError: Do not know how to serialize a BigInt`.
- **SC-003**: Thời gian phản hồi của các thao tác CRUD và Ingest tài liệu qua Prisma không bị suy giảm so với khi sử dụng mysql2 (chênh lệch dưới 10%).
- **SC-004**: Đảm bảo 100% dữ liệu ingest được ghi đầy đủ hoặc rollback sạch sẽ khi có lỗi xảy ra (không có document mồ côi hay question mồ côi).

## Assumptions

- Thông tin cấu hình database kết nối sẽ sử dụng biến môi trường `DATABASE_URL` có sẵn trong `.env` tương thích với Prisma.
- Không thay đổi cấu trúc bảng cơ sở dữ liệu hiện tại (database schema), Prisma Client sẽ hoạt động dựa trên schema đã sinh ra từ DB hiện có.
