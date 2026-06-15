# Feature Specification: Quản lý Giáo trình (Syllabus/Topics) và Thẻ (Tags)

**Feature Branch**: `005-syllabus-tag-management`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "tạo chức năng quản lý syllabus (lms_topics) và quản lý tags"

## Clarifications

### Session 2026-06-16

- Q: Rà soát lại codebase, kiểm tra xem sau khi merge các nhánh thì có đoạn code nào chưa chuyển sang prisma hay không? Nếu có tồn tại code kết nối cơ sở dữ liệu kiểu cũ, thì chuyển sang prisma → A: Đã rà soát và xác định không còn code kết nối cơ sở dữ liệu kiểu cũ (`mysql2`) trong thư mục ứng dụng chính (`src/`). Đã di chuyển thành công cả hai script một lần (`scripts/migrate-mathpix-images.ts` và `scripts/migrate-link-s3-answer.mjs`) từ `mysql2` sang sử dụng Prisma Client để đảm bảo 100% codebase đồng bộ.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quản lý Cây Chủ đề Học thuật (Syllabus/Topics Hierarchy) (Priority: P1)

Là một Quản trị viên học vụ hoặc Giáo viên biên soạn nội dung, tôi muốn có một giao diện trực quan để xem, tạo mới, cập nhật, thay đổi vị trí (chuyển nút cha) và xóa các chủ đề trong cây `lms_topics`, để tôi có thể dễ dàng cập nhật và tinh chỉnh cấu trúc giáo trình học thuật của trung tâm.

**Why this priority**: Cây chủ đề (`lms_topics`) là xương sống của hệ thống quản lý học tập. Khả năng chỉnh sửa trực tiếp cấu trúc cây là tối quan trọng để quản lý giáo án và phân bổ nội dung câu hỏi.

**Independent Test**: Quản trị viên truy cập màn hình quản lý chủ đề, tạo mới một chủ đề con, thay đổi chủ đề cha của nó sang một nhánh khác, và kiểm tra xem cấu trúc hiển thị cũng như dữ liệu trong DB (đặc biệt là cột `path`) được cập nhật chính xác.

**Acceptance Scenarios**:

1. **Given** Quản trị viên đang ở màn hình quản lý chủ đề, **When** điền tên chủ đề, mã code, chọn chủ đề cha và nhấp "Lưu", **Then** chủ đề mới được tạo ra với `path` tự động ghép từ `path` của cha cộng với ID của chính nó.
2. **Given** Một chủ đề có chứa các chủ đề con bên dưới, **When** người dùng kéo thả hoặc thay đổi chủ đề cha của chủ đề đó, **Then** hệ thống cập nhật thành công nút cha mới đồng thời tự động tính toán lại đường dẫn `path` cho toàn bộ các chủ đề con cháu thuộc nhánh đó.

---

### User Story 2 - Quản lý Danh mục Thẻ (Tags Management) (Priority: P1)

Là một Quản trị viên hoặc Giáo viên, tôi muốn có giao diện quản lý danh sách thẻ (Tags), cho phép xem, tạo mới, chỉnh sửa và xóa các thẻ tag kèm theo nhóm phân loại (Category) như nguồn gốc đề (SOURCE), phương pháp giải (METHOD), kỹ năng tư duy (SKILL), để chuẩn hóa bộ nhãn dán cho ngân hàng câu hỏi.

**Why this priority**: Cho phép chuẩn hóa dữ liệu thẻ trước khi giáo viên gắn thẻ cho câu hỏi, tránh việc tạo thẻ trùng lặp hoặc lộn xộn.

**Independent Test**: Quản trị viên tạo một tag mới với tên "Đề chuyên Sư Phạm 2026" thuộc nhóm "SOURCE", sau đó đổi tên tag thành "Chuyên Sư Phạm 2026" và kiểm tra xem sự thay đổi có được áp dụng chính xác.

**Acceptance Scenarios**:

1. **Given** Người dùng ở trang quản lý thẻ, **When** tạo một thẻ mới với tên trùng với một thẻ đã tồn tại (không phân biệt chữ hoa chữ thường), **Then** hệ thống thông báo lỗi và không cho phép lưu.
2. **Given** Danh sách thẻ có sẵn, **When** người dùng tạo mới hoặc cập nhật một thẻ với nhóm category hợp lệ (ví dụ: "METHOD"), **Then** hệ thống lưu trữ chính xác thông tin thẻ và nhóm tương ứng.

---

### User Story 3 - Xử lý Ràng buộc Khi Xóa Chủ đề và Thẻ (Priority: P2)

Là một Quản trị viên, khi tôi thực hiện xóa một chủ đề hoặc một thẻ tag, tôi muốn hệ thống kiểm tra các liên kết hiện có với câu hỏi hoặc các chủ đề con và đưa ra cảnh báo hoặc hành động an toàn phù hợp, để tránh làm mất dữ liệu liên kết quan trọng của các câu hỏi hiện hành.

**Why this priority**: Đảm bảo tính toàn vẹn của dữ liệu trong cơ sở dữ liệu và ngăn chặn lỗi mồ côi (orphaned data) của câu hỏi học thuật.

**Independent Test**: Quản trị viên cố gắng xóa một chủ đề đang chứa 5 câu hỏi và kiểm tra xem hệ thống có hiển thị cảnh báo chặn hoặc yêu cầu xác nhận kèm thông tin cụ thể hay không.

**Acceptance Scenarios**:

1. **Given** Một chủ đề đang có các chủ đề con hoặc đang được liên kết với câu hỏi, **When** người dùng nhấp xóa chủ đề đó, **Then** hệ thống PHẢI ngăn chặn hành động xóa, đồng thời hiển thị danh sách các câu hỏi liên quan kèm giao diện cho phép lựa chọn và chuyển đổi nhanh toàn bộ các câu hỏi này sang một chủ đề đích khác.
2. **Given** Một thẻ tag đang được gắn cho nhiều câu hỏi, **When** người dùng thực hiện xóa tag đó, **Then** hệ thống yêu cầu xác nhận và tự động gỡ liên kết của tag này khỏi toàn bộ câu hỏi liên quan mà không làm ảnh hưởng đến thông tin khác của câu hỏi.

---

### Edge Cases

- **Xử lý vòng lặp đệ quy**: Ngăn chặn trường hợp người dùng vô tình cấu hình một chủ đề làm cha của chính nó hoặc cha của một chủ đề tổ tiên của nó (tạo vòng lặp vô hạn trong cây).
- **Trùng lặp mã chủ đề (code)**: Cần kiểm tra tính duy nhất của mã code chủ đề (`lms_topics.code`) để đảm bảo việc định danh và đồng bộ hóa chính xác.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cung cấp giao diện hiển thị cây phân cấp chủ đề học thuật trực quan (Tree View).
- **FR-002**: Hệ thống PHẢI cho phép Quản trị viên thực hiện các thao tác CRUD (Tạo, Đọc, Cập nhật, Xóa) trên thực thể Chủ đề (`lms_topics`).
- **FR-003**: Khi cập nhật nút cha (`parent_id`) của một Chủ đề, hệ thống PHẢI tự động chạy một tiến trình cập nhật đường dẫn `path` đệ quy cho toàn bộ các node con cháu của nó.
- **FR-004**: Hệ thống PHẢI cung cấp giao diện CRUD cho các thẻ tag (`lms_tags`) bao gồm tên tag (`name`) và nhóm phân loại (`category`).
- **FR-005**: Hệ thống PHẢI thực hiện chuẩn hóa dữ liệu đầu vào của thẻ (loại bỏ khoảng trắng thừa đầu cuối, tự động chuẩn hóa chữ hoa/chữ thường để kiểm tra trùng lặp).
- **FR-006**: Hệ thống PHẢI kiểm tra các ràng buộc liên kết (Foreign Key constraints / Relation checks) trước khi thực hiện xóa Chủ đề hoặc Thẻ để đảm bảo tính toàn vẹn dữ liệu.
- **FR-007**: Hệ thống PHẢI hỗ trợ giao diện hiển thị danh sách các câu hỏi liên quan trực tiếp và gián tiếp (qua chủ đề con) khi người dùng yêu cầu xóa chủ đề đang có liên kết.
- **FR-008**: Hệ thống PHẢI cung cấp tính năng chuyển đổi hàng loạt (Bulk Transfer) câu hỏi từ chủ đề hiện tại sang một chủ đề đích khác được chọn trước khi thực hiện xóa chủ đề cũ.

### Key Entities *(include if feature involves data)*

- **lms_topics (Chủ đề)**: Đại diện cho một nút trong cấu trúc cây giáo trình.
  - Các trường chính cần quản lý: `id`, `title`, `code`, `content`, `parent_id`, `path`, `order_index`, `syllabus_id`.
- **lms_tags (Thẻ)**: Dùng để phân loại bổ trợ cho câu hỏi.
  - Các trường chính cần quản lý: `id`, `name` (unique), `category` (ví dụ: "SOURCE", "METHOD", "SKILL").
- **lms_topics_questions**: Bảng trung gian liên kết giữa câu hỏi và chủ đề.
- **lms_questions_tags**: Bảng trung gian liên kết giữa câu hỏi và thẻ tag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng có thể hoàn thành việc tạo một chủ đề con mới hoặc di chuyển một chủ đề sang cha mới trên giao diện trong vòng dưới 15 giây.
- **SC-002**: Việc cập nhật lại đường dẫn `path` cho toàn bộ nhánh con (lên đến 100 node con cháu) khi đổi cha phải hoàn tất trong vòng dưới 300ms.
- **SC-003**: Không xảy ra bất kỳ trường hợp câu hỏi bị mồ côi (mất liên kết chủ đề bắt buộc) hoặc lỗi dữ liệu đường dẫn `path` sai lệch sau khi cập nhật cây.
- **SC-004**: Người dùng có thể tìm kiếm và lọc danh sách thẻ tag trong số 1000+ tag trong thời gian dưới 200ms.

## Assumptions

- Môi trường cơ sở dữ liệu đã hỗ trợ sẵn các bảng `lms_topics`, `lms_tags`, `lms_topics_questions` và `lms_questions_tags` theo cấu trúc Prisma hiện tại.
- Người dùng thực hiện các thao tác quản lý này là người dùng có vai trò Quản trị viên (Admin/Staff) hoặc Giáo viên được cấp quyền.
- Hệ thống hỗ trợ cập nhật cây chủ đề qua API bằng JSON.
