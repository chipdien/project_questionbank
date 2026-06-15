# Feature Specification: Hoàn thiện Bộ Tiêu chí Phân loại và Bộ lọc Ngân hàng Câu hỏi

**Feature Branch**: `006-question-classification-filtering`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "hoàn thiện bộ tiêu chí phân loại questions và xây dựng bộ lọc trong question bank theo các bộ tiêu chí đó"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Phân loại câu hỏi đa chiều (Priority: P1)

Là một Giáo viên hoặc Quản trị viên biên soạn nội dung, tôi muốn gắn các tiêu chí phân loại chi tiết cho câu hỏi bao gồm Khối lớp, Độ khó, Chủ đề học thuật (lms_topics) và các Thẻ bổ trợ (lms_tags thuộc các danh mục như SOURCE, METHOD, SKILL), để câu hỏi được phân loại khoa học và dễ dàng tìm kiếm lại.

**Why this priority**: Phân loại chính xác là điều kiện cần để xây dựng một ngân hàng đề thi chất lượng và phục vụ cho các bộ lọc thông minh.

**Independent Test**: Người dùng mở trang chi tiết câu hỏi hoặc hộp thoại phân loại câu hỏi, chọn Khối lớp 10, Độ khó "Trung bình", Chủ đề "Phương trình bậc hai", và thêm thẻ nguồn "Chuyên Sư Phạm 2026", lưu lại và kiểm tra thông tin hiển thị chính xác.

**Acceptance Scenarios**:

1. **Given** Người dùng đang ở màn hình phân loại câu hỏi, **When** chọn các giá trị Khối lớp, Độ khó, chọn một Chủ đề cụ thể và các thẻ tag phù hợp rồi bấm "Lưu", **Then** hệ thống cập nhật thành công các mối liên kết trong DB (`lms_questions`, `lms_topics_questions`, `lms_questions_tags`).
2. **Given** Một câu hỏi đã có phân loại cũ, **When** người dùng thay đổi thông tin phân loại sang giá trị mới hoặc gỡ bỏ một số thẻ tag, **Then** hệ thống cập nhật chính xác và gỡ bỏ các liên kết cũ tương ứng.

---

### User Story 2 - Tìm kiếm và Lọc câu hỏi nâng cao trong Ngân hàng Câu hỏi (Priority: P1)

Là một Giáo viên biên soạn đề thi, tôi muốn có một bộ lọc thông minh trong Ngân hàng câu hỏi cho phép lọc nhanh theo Khối lớp, Độ khó, Cây chủ đề học thuật (lms_topics) và Thẻ phân loại (Tags theo danh mục SOURCE, METHOD, SKILL), giúp tôi tìm đúng câu hỏi mong muốn trong vài giây.

**Why this priority**: Đây là tính năng cốt lõi giúp giáo viên khai thác ngân hàng câu hỏi hiệu quả khi tạo đề kiểm tra hoặc tài liệu học tập.

**Independent Test**: Giáo viên truy cập Question Bank, chọn bộ lọc Khối lớp 9, Độ khó "Khó", chọn Chủ đề cha "Hình học", và kiểm tra danh sách hiển thị chỉ gồm các câu hỏi thỏa mãn các tiêu chí này.

**Acceptance Scenarios**:

1. **Given** Người dùng ở trang Ngân hàng câu hỏi, **When** chọn lọc theo Chủ đề cha (ví dụ: "Đại số"), **Then** hệ thống hiển thị tất cả các câu hỏi thuộc chủ đề "Đại số" và toàn bộ các câu hỏi thuộc các chủ đề con cháu trực thuộc (ví dụ: "Hàm số", "Phương trình").
2. **Given** Người dùng áp dụng nhiều tiêu chí lọc đồng thời (ví dụ: Khối lớp 11 AND Độ khó "Dễ" AND Tag "Phương pháp tọa độ"), **Then** hệ thống thực hiện truy vấn giao (AND) giữa các tiêu chí và hiển thị kết quả chính xác.

---

### User Story 3 - Tìm kiếm toàn văn kết hợp bộ lọc (Priority: P2)

Là một Giáo viên, tôi muốn nhập từ khóa tìm kiếm (ví dụ: "parabol") kết hợp song song với các bộ lọc phân loại đang chọn để thu hẹp nhanh danh sách câu hỏi cần tìm.

**Why this priority**: Giúp tăng tốc độ tìm kiếm khi ngân hàng câu hỏi có số lượng cực kỳ lớn và giáo viên nhớ một vài từ khóa trong đề bài.

**Independent Test**: Giáo viên gõ từ khóa "tích phân" vào thanh tìm kiếm, chọn thêm lọc Khối lớp 12, kiểm tra danh sách kết quả chỉ hiển thị các câu hỏi lớp 12 có chứa từ "tích phân".

**Acceptance Scenarios**:

1. **Given** Ng- **FR-001**: Hệ thống PHẢI hỗ trợ liên kết câu hỏi (`lms_questions`) với một hoặc nhiều Chủ đề (`lms_topics`) và một hoặc nhiều Thẻ (`lms_tags`).
- **FR-002**: Hệ thống PHẢI cung cấp giao diện Bộ lọc (Filter Panel) trực quan bên cạnh danh sách câu hỏi, hỗ trợ lọc theo:
  - Khối lớp (Grade)
  - Độ khó (Difficulty) - Gồm 5 cấp độ: Nhận biết, Thông hiểu, Vận dụng thấp, Vận dụng cao, Vận dụng thực tế / Chuyên sâu.
  - Loại hình câu hỏi (Question Type) - Gồm: Trắc nghiệm 1 đáp án đúng (`single_choice`), Trắc nghiệm nhiều đáp án đúng (`multiple_choice`), Đúng/Sai (`true_false`), Điền khuyết (`fill_in_the_blank`), Tự luận (`essay`).
  - Cấu trúc câu hỏi: Câu hỏi độc lập (`complex` khác `main` và `sub`), Câu hỏi chùm (`complex = main`), hoặc cả hai.
  - Chủ đề (Topics) - hiển thị dạng cây phân cấp (Tree View) hoặc Dropdown phân cấp thu gọn được.
  - Thẻ tag (Tags) - phân tách rõ ràng theo các nhóm Category: SOURCE (Nguồn gốc), METHOD (Phương pháp giải), SKILL (Kỹ năng tư duy), TYPE (Phân biệt Lý thuyết / Vận dụng), EXAM (Kỳ thi nhắm tới), và YEAR (Năm thi).
- **FR-003**: Hệ thống PHẢI hỗ trợ lọc đệ quy theo chủ đề. Khi người dùng chọn lọc một chủ đề, hệ thống phải tự động trả về cả các câu hỏi liên kết với các chủ đề con cháu của nó (bằng cách so sánh đường dẫn `path` bắt đầu bằng `path` của chủ đề đã chọn).
- **FR-004**: Giao diện hiển thị danh sách kết quả tìm kiếm/lọc chỉ hiển thị các câu hỏi độc lập và câu hỏi chùm (`complex = main` hoặc `complex` trống/null). Các câu hỏi con (`complex = sub`) PHẢI được hiển thị lồng/group bên trong câu hỏi chùm cha của nó tương ứng (thông qua liên kết `ref_question_id`), không hiển thị rời rạc độc lập.
- **FR-005**: Hệ thống PHẢI cung cấp ô tìm kiếm toàn văn hỗ trợ tìm kiếm không dấu/có dấu trên trường `statement` và `content` của câu hỏi.
- **FR-006**: API/Server Action lấy danh sách câu hỏi (`getLibraryQuestions` hoặc tương đương) PHẢI được nâng cấp để hỗ trợ các tham số lọc nâng cao: `grades`, `difficulties`, `questionTypes` (mảng loại câu hỏi), `topicIds` (mảng ID), `tagIds` (mảng ID), `complex` (lọc theo cấu trúc), và `keyword`.
- **FR-007**: Giao diện hiển thị câu hỏi PHẢI hiển thị đầy đủ các badge phân loại trực quan (Khối lớp, Độ khó với màu sắc tương ứng từ `lms_difficulties`, Loại hình câu hỏi, Tên chủ đề liên kết, và các thẻ tag).
- **FR-008**: Hệ thống PHẢI lưu trữ trạng thái bộ lọc trên URL (Query Parameters) để người dùng có thể chia sẻ liên kết kết quả lọc hoặc quay lại trang trước đó mà không bị mất bộ lọc.

### Key Entities *(include if feature involves data)*

- **lms_questions (Câu hỏi)**: Thực thể chính cần được lọc và phân loại, chứa các trường `grade`, `question_difficulty`, `question_type`, `complex`, `ref_question_id`, `statement`, `content`.
- **lms_topics (Chủ đề học thuật)**: Cấu trúc cây phân cấp chủ đề gắn liền với câu hỏi qua bảng trung gian `lms_topics_questions`.
- **lms_tags (Thẻ phân loại bổ trợ)**: Các tag gán cho câu hỏi qua bảng trung gian `lms_questions_tags`, phân loại theo cột `category` (SOURCE, METHOD, SKILL, TYPE, EXAM, YEAR).
- **lms_difficulties (Độ khó)**: Chứa danh sách mức độ khó (5 mức) và mã màu hiển thị của chúng.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Thời gian phản hồi của API/Action lấy danh sách câu hỏi khi áp dụng bộ lọc phức tạp (nhiều lớp) trên cơ sở dữ liệu thử nghiệm 10,000 câu hỏi phải dưới 300ms.
- **SC-002**: Tốc độ render giao diện và tương tác với cây bộ lọc chủ đề mượt mà, không giật lag (đáp ứng tiêu chuẩn 60fps khi tương tác).
- **SC-003**: 100% các câu hỏi thuộc chủ đề con cháu phải được hiển thị chính xác khi người dùng chọn lọc theo chủ đề cha tương ứng.
- **SC-004**: Người dùng có thể thực hiện thao tác lọc và tìm ra câu hỏi mong muốn chỉ trong vòng dưới 3 lượt click chuột.

## Assumptions

- Các chỉ mục (indexes) trên các cột được lọc như `lms_questions.grade`, `lms_questions.question_difficulty`, `lms_questions.question_type`, `lms_questions.complex`, `lms_topics.path`, `lms_tags.category` đã được thiết lập tối ưu trong cơ sở dữ liệu.
- Cây chủ đề `lms_topics` đã có trường `path` hợp lệ và được tính toán chính xác để phục vụ cho việc lọc đệ quy.
�t bộ lọc.

### Key Entities *(include if feature involves data)*

- **lms_questions (Câu hỏi)**: Thực thể chính cần được lọc và phân loại, chứa các trường `grade`, `question_difficulty`, `question_type`, `statement`, `content`.
- **lms_topics (Chủ đề học thuật)**: Cấu trúc cây phân cấp chủ đề gắn liền với câu hỏi qua bảng trung gian `lms_topics_questions`.
- **lms_tags (Thẻ phân loại bổ trợ)**: Các tag gán cho câu hỏi qua bảng trung gian `lms_questions_tags`, phân loại theo cột `category` (SOURCE, METHOD, SKILL, TYPE).
- **lms_difficulties (Độ khó)**: Chứa danh sách mức độ khó (5 mức) và mã màu hiển thị của chúng.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Thời gian phản hồi của API/Action lấy danh sách câu hỏi khi áp dụng bộ lọc phức tạp (nhiều lớp) trên cơ sở dữ liệu thử nghiệm 10,000 câu hỏi phải dưới 300ms.
- **SC-002**: Tốc độ render giao diện và tương tác với cây bộ lọc chủ đề mượt mà, không giật lag (đáp ứng tiêu chuẩn 60fps khi tương tác).
- **SC-003**: 100% các câu hỏi thuộc chủ đề con cháu phải được hiển thị chính xác khi người dùng chọn lọc theo chủ đề cha tương ứng.
- **SC-004**: Người dùng có thể thực hiện thao tác lọc và tìm ra câu hỏi mong muốn chỉ trong vòng dưới 3 lượt click chuột.

## Assumptions

- Các chỉ mục (indexes) trên các cột được lọc như `lms_questions.grade`, `lms_questions.question_difficulty`, `lms_questions.question_type`, `lms_topics.path`, `lms_tags.category` đã được thiết lập tối ưu trong cơ sở dữ liệu.
- Cây chủ đề `lms_topics` đã có trường `path` hợp lệ và được tính toán chính xác để phục vụ cho việc lọc đệ quy.

