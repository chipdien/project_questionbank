# Feature Specification: Nâng Cấp Hệ Thống Phân Loại Chủ Đề Và Gắn Thẻ Câu Hỏi (Topic Taxonomy & Tagging Upgrade)

**Feature Branch**: `004-topic-taxonomy-upgrade`

**Created**: 2026-06-15

**Status**: Draft

**Input**: Mô tả người dùng: "Nâng cấp bảng lms_topics với phương pháp Materialized path + bổ sung thêm các bảng tags"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quản lý cấu trúc phân cấp Chủ đề học thuật (Priority: P1)

Là một Quản trị viên nội dung / Giáo viên, tôi muốn xây dựng cây thư mục chủ đề học tập đệ quy không giới hạn cấp độ (ví dụ: Syllabus > Topic > Lesson > Sub-lesson), để tôi có thể tổ chức giáo trình của trung tâm một cách linh hoạt mà không bị giới hạn bởi cấu trúc cứng nhắc.

**Why this priority**: Đây là nền tảng cốt lõi của tính năng phân cấp học thuật mới, thay thế cho cấu trúc 3 bảng cũ và cho phép định hình lại lộ trình học tập.

**Independent Test**: Quản trị viên tạo ra một cây chủ đề sâu 4 cấp và kiểm tra xem hệ thống có lưu trữ chính xác quan hệ cha-con cũng như hiển thị đúng cấu trúc phân cấp hay không.

**Acceptance Scenarios**:

1. **Given** Quản trị viên đang ở màn hình quản lý chủ đề, **When** tạo mới một chủ đề con dưới một chủ đề cha đã có, **Then** hệ thống ghi nhận chính xác mối quan hệ cha-con và cập nhật đường dẫn (path) đầy đủ từ gốc tới chủ đề mới đó.
2. **Given** Cây chủ đề có sẵn nhiều cấp, **When** người dùng yêu cầu hiển thị, **Then** hệ thống trả về chính xác thứ tự phân cấp và định vị của từng phần tử trong cây.

---

### User Story 2 - Gắn thẻ (Tagging) đa chiều cho câu hỏi (Priority: P1)

Là một Giáo viên, tôi muốn gán một hoặc nhiều thẻ (Tag) khác nhau thuộc các nhóm phân loại (Category) cho một câu hỏi, để mô tả chi tiết các thuộc tính đa chiều như phương pháp giải, nguồn gốc đề thi, kỹ năng tư duy, giúp việc tìm kiếm câu hỏi trở nên đa dạng.

**Why this priority**: Cho phép gán các nhãn linh hoạt cho câu hỏi mà không làm ảnh hưởng đến cấu trúc cây phân cấp học thuật, giúp việc quản lý câu hỏi đạt hiệu quả tối đa.

**Independent Test**: Giáo viên gán 3 tag khác nhau thuộc các nhóm khác nhau cho một câu hỏi và kiểm tra xem các tag này có hiển thị đầy đủ và chính xác trên câu hỏi đó không.

**Acceptance Scenarios**:

1. **Given** Giáo viên đang biên soạn câu hỏi, **When** chọn các thẻ tag hiện có để gắn vào câu hỏi và lưu lại, **Then** câu hỏi được liên kết thành công với tất cả thẻ tag đó.
2. **Given** Giáo viên muốn gom nhóm các tag, **When** tạo một tag mới và gán nó vào một nhóm tag (như "Phương pháp giải" hoặc "Nguồn gốc đề"), **Then** hệ thống phân loại chính xác tag đó vào nhóm tương ứng.

---

### User Story 3 - Tìm kiếm và Lọc câu hỏi nâng cao (Priority: P2)

Là một Giáo viên / Người tạo đề thi, tôi muốn tìm kiếm câu hỏi bằng cách kết hợp cả vị trí của nó trên cây chủ đề (bao gồm cả các chủ đề con phía dưới) và các thẻ tag bổ trợ, để tôi có thể nhanh chóng tạo ra một đề thi đúng yêu cầu trong vài giây.

**Why this priority**: Đây là giá trị sử dụng trực tiếp lớn nhất đối với giáo viên, giúp giảm thiểu thời gian tìm kiếm và biên soạn tài liệu học tập.

**Independent Test**: Giáo viên thực hiện lọc câu hỏi thuộc một chuyên đề lớn (ví dụ: "Hình học Lớp 5") có kết hợp tag "Vận dụng cao" và kiểm tra xem danh sách trả về có chứa đúng các câu hỏi tương thích hay không.

**Acceptance Scenarios**:

1. **Given** Kho câu hỏi có hàng nghìn câu, **When** giáo viên chọn lọc câu hỏi thuộc một Chủ đề cha và tất cả các chủ đề con cháu của nó, **Then** hệ thống trả về đúng toàn bộ câu hỏi nằm trong phân nhánh đó.
2. **Given** Giao diện tạo đề thi, **When** giáo viên kết hợp điều kiện lọc theo Chủ đề đệ quy và đồng thời chứa một số Thẻ tag cụ thể, **Then** hệ thống trả về chính xác tập hợp câu hỏi thỏa mãn cả 2 điều kiện.

---

### Edge Cases

- **Di chuyển Node trên cây chủ đề**: Khi một chủ đề cha bị di chuyển sang một nhánh cha mới hoặc bị xóa, hệ thống sẽ xử lý thế nào đối với các chủ đề con và đường dẫn (path) của toàn bộ các con cháu phía dưới nó?
- **Tránh trùng lặp tag (Tag Duplication)**: Làm thế nào để hệ thống ngăn chặn việc giáo viên tạo các tag trùng lặp hoặc tương tự nhau do lỗi chính tả hoặc viết hoa/viết thường (ví dụ: "toán lớp 5" vs "Toán Lớp 5")?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI hỗ trợ cấu trúc tự tham chiếu (Self-referencing) trên thực thể Chủ đề (Topic) để tạo cấu trúc đệ quy không giới hạn cấp độ.
- **FR-002**: Hệ thống PHẢI lưu trữ toàn bộ đường dẫn từ gốc đến node hiện tại (Materialized Path) cho mỗi Chủ đề để tối ưu hóa việc truy vấn cây.
- **FR-003**: Khi một Chủ đề được tạo mới hoặc thay đổi nút cha, hệ thống PHẢI tự động cập nhật lại đường dẫn (path) của chính nó và toàn bộ các chủ đề con cháu thuộc nhánh đó.
- **FR-004**: Hệ thống PHẢI cung cấp khả năng phân loại Thẻ (Tag) theo các nhóm (Category) được định nghĩa trước (như SOURCE, METHOD, SKILL).
- **FR-005**: Hệ thống PHẢI cho phép liên kết Một-Nhiều hoặc Nhiều-Nhiều giữa Câu hỏi và Chủ đề đệ quy, cũng như Nhiều-Nhiều giữa Câu hỏi và Thẻ tag.
- **FR-006**: Hệ thống PHẢI chuẩn hóa tên Tag trước khi lưu trữ (ví dụ: loại bỏ khoảng trắng thừa, chuyển về chữ thường hoặc chữ hoa tiêu chuẩn) để tránh trùng lặp.
- **FR-007**: Hệ thống PHẢI hỗ trợ truy vấn nhanh toàn bộ các câu hỏi thuộc một Chủ đề cụ thể bao gồm tất cả các chủ đề con cháu của nó bằng cách sử dụng Materialized Path.

### Key Entities *(include if feature involves data)*

- **Topic (Chủ đề học thuật)**: Đại diện cho một nút trong cây danh mục học thuật (có thể là Syllabus, Chuyên đề, Bài học). Có các thuộc tính chính: Tên chủ đề, Mô tả, ID cha (parent_id), và Đường dẫn materialized (path).
- **Tag (Thẻ bổ trợ)**: Nhãn dán dùng để đánh dấu đặc tính câu hỏi. Có thuộc tính: Tên tag (unique), Nhóm phân loại (Category).
- **Question (Câu hỏi)**: Thực thể chứa nội dung câu hỏi, liên kết tới một hoặc nhiều Topic và có thể được gán nhiều Tag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Giáo viên có thể hoàn thành việc gán chủ đề và gắn thẻ cho một câu hỏi mới trong vòng dưới 30 giây.
- **SC-002**: Thời gian tìm kiếm và lọc câu hỏi theo cấu trúc đệ quy kết hợp với tag phải phản hồi ngay lập tức cho người dùng (dưới 500ms khi hiển thị kết quả) kể cả với ngân hàng hàng chục nghìn câu hỏi.
- **SC-003**: 100% các câu hỏi thuộc nhánh con cháu của một Chủ đề được truy vấn đầy đủ và chính xác khi thực hiện lọc theo chủ đề cha.
- **SC-004**: Giảm thiểu việc tạo sai/trùng lặp tag xuống dưới 1% thông qua cơ chế gợi ý và chuẩn hóa của hệ thống.

## Assumptions

- Các dữ liệu học thuật cũ (bảng `lms_syllabus`, `lms_topics`, `lms_lessons`) sẽ cần một kịch bản di chuyển (migration script) để chuyển đổi toàn bộ sang cấu trúc đệ quy mới của bảng `lms_topics` mà không làm mất liên kết câu hỏi hiện tại.
- Hỗ trợ giao diện kéo thả hoặc chỉnh sửa cây thư mục sẽ được thực hiện trong phạm vi dự án này hoặc được giả định là có sẵn API hỗ trợ.
- Hệ thống cơ sở dữ liệu MySQL hiện tại (8.0.24) hỗ trợ đầy đủ các hàm xử lý chuỗi và CTE để đồng hành cùng giải pháp Materialized Path.
