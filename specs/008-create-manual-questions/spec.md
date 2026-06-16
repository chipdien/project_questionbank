# Đặc tả tính năng: Tạo Câu hỏi Thủ công

**Feature Branch**: `008-create-manual-questions`

**Created**: 2026-06-16

**Status**: Draft

**Input**: Yêu cầu người dùng về giao diện tạo câu hỏi thủ công, hỗ trợ các loại câu hỏi (Trắc nghiệm, Đúng/Sai, Điền khuyết, Tự luận), bố cục 2 cột (Biên soạn bên trái, phân loại bên phải), tái cấu trúc Sidebar và tách tác vụ lưu trữ sang dịch vụ backend riêng biệt.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Biên soạn câu hỏi thủ công đa dạng loại hình (Priority: P1)

Là một Giáo viên hoặc Quản trị viên, tôi muốn tự tay soạn thảo câu hỏi mới trực tiếp trên hệ thống với các loại hình câu hỏi khác nhau (Trắc nghiệm, Đúng/Sai, Điền khuyết, Tự luận) để phong phú thêm ngân hàng câu hỏi mà không cần phụ thuộc hoàn toàn vào việc tải lên/phân tách tài liệu tự động.

**Why this priority**: Giáo viên thường xuyên cần thêm nhanh 1-2 câu hỏi mới tự biên soạn vào ngân hàng để sử dụng ngay cho các đề kiểm tra sắp tới.

**Independent Test**:
1. Người dùng truy cập màn hình "Tạo thủ công" từ Sidebar.
2. Chọn loại hình "Trắc nghiệm" và biên soạn nội dung đề bài cùng 4 phương án, đánh dấu 1 phương án là đáp án đúng.
3. Chọn loại hình "Đúng / Sai" và soạn thảo 4 phát biểu con, tích chọn Đúng hoặc Sai cho từng phát biểu.
4. Chọn loại hình "Tự luận" và soạn thảo đề bài kèm lời giải chi tiết.
5. Kiểm tra tính năng hiển thị trực quan và lưu trữ chính xác.

**Acceptance Scenarios**:
1. **Given** Người dùng chọn loại hình câu hỏi, **When** form đáp án động tương ứng hiển thị, **Then** người dùng có thể nhập dữ liệu và sử dụng trình soạn thảo `VditorEditor` cho tất cả các vùng nhập liệu (đề bài, phương án, lời giải).
2. **Given** Người dùng lưu câu hỏi, **When** hệ thống xử lý, **Then** dữ liệu được lưu đúng cấu trúc CSDL (`lms_questions`, `lms_options`) và thông báo lưu thành công.

---

### User Story 2 - Gắn nhãn phân loại học thuật & tags không bị rối mắt (Priority: P1)

Là một Giáo viên, tôi muốn vừa biên soạn nội dung câu hỏi vừa có thể dễ dàng liên kết câu hỏi đó với Khối lớp, Độ khó, Cây chủ đề học thuật đệ quy, và các nhóm Tag bổ trợ trong cùng một màn hình mà không bị rối mắt hay mất tập trung.

**Why this priority**: Giúp tăng tốc độ nhập liệu và đảm bảo mọi câu hỏi tạo mới đều được phân loại đầy đủ ngay từ đầu, tạo điều kiện cho bộ lọc của Question Bank hoạt động tốt.

**Independent Test**:
1. Giáo viên đang soạn thảo câu hỏi ở cột trái.
2. Tại cột phải (bảng phân loại), giáo viên bấm mở rộng các nhánh cây chủ đề học thuật và tích chọn chủ đề "Đại số 10 -> Hàm số bậc hai".
3. Chọn khối lớp "10", độ khó "Thông hiểu".
4. Bấm chọn nhanh một số Tag bổ trợ (ví dụ: SOURCE -> "Chuyên KHTN", METHOD -> "Tự luận ngắn").
5. Nhấn Lưu và xác nhận câu hỏi đã được gắn đúng toàn bộ liên kết này trong cơ sở dữ liệu.

**Acceptance Scenarios**:
1. **Given** Người dùng cuộn trang ở cột trái biên soạn nội dung, **When** cột phải chứa bảng gắn nhãn, **Then** cột phải vẫn giữ nguyên vị trí (Sticky Panel) giúp người dùng có thể thao tác gắn nhãn bất cứ lúc nào mà không cần cuộn trang lên xuống.
2. **Given** Người dùng tương tác với cây chủ đề đệ quy, **When** click chọn các nút thư mục, **Then** cây mở rộng/thu gọn mượt mà và cho phép tích chọn nhiều node.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cập nhật Sidebar để tái cấu trúc mục "Xử lý tài liệu" thành một nhóm menu có phân cấp:
  - Menu chi tiết:
    - Menu cha: **Xử lý tài liệu** (Icon: `FolderSync`)
    - Menu con 1: **Tạo thủ công** (Dẫn tới trang `/manual-create`)
    - Menu con 2: **Import tài liệu** (Dẫn tới trang `/` - màn hình import cũ)
- **FR-002**: Giao diện trang Tạo thủ công PHẢI sử dụng bố cục **Two-Column Split Layout**:
  - **Cột bên Trái (Biên soạn - Chiếm 70%)**: Chứa thẻ chọn loại câu hỏi, VditorEditor nhập đề bài và form đáp án động.
  - **Cột bên Phải (Phân loại - Chiếm 30%)**: Chứa các thẻ select/chip chọn Khối lớp, Độ khó; cây Chủ đề đệ quy (Topics Tree) và danh sách thẻ phân loại bổ trợ (Tags) được gom nhóm theo 6 categories (`SOURCE`, `METHOD`, `SKILL`, `TYPE`, `EXAM`, `YEAR`).
- **FR-003**: Trình soạn thảo đề bài và đáp án/lời giải PHẢI sử dụng component `VditorEditor` đã tích hợp sẵn để hỗ trợ nhập các ký tự đặc biệt, công thức LaTeX và markdown.
- **FR-004**: Form đáp án PHẢI thay đổi động dựa trên loại câu hỏi được chọn:
  - **Trắc nghiệm (`SINGLE_CHOICE` / `MULTIPLE_CHOICE`)**: Hiển thị 4 ô nhập phương án (A, B, C, D) kèm theo checkbox/radio lựa chọn "Đáp án đúng" cho mỗi ô.
  - **Đúng / Sai (`TRUE_FALSE`)**: Hiển thị 4 phát biểu con, mỗi phát biểu có tùy chọn tích Đúng / Sai tương ứng.
  - **Điền khuyết (`FILL_IN`)**: Cho phép người dùng nhập đề bài chứa ký hiệu khoảng trống `[blank]`. Hệ thống tự nhận diện số lượng khoảng trống và hiển thị các trường nhập đáp án tương ứng.
  - **Tự luận (`ESSAY`)**: Hiển thị duy nhất một trình soạn thảo `VditorEditor` để nhập hướng dẫn giải / đáp án chi tiết.
- **FR-005**: Hệ thống PHẢI xây dựng một file dịch vụ backend riêng biệt là `src/lib/services/question-manual.service.ts` để thực thi logic tạo câu hỏi và các liên kết trong DB, tránh làm phình file `src/actions/question.ts`.
- **FR-006**: Khi lưu câu hỏi thành công, hệ thống PHẢI hiển thị thông báo thành công và làm trống form hoặc chuyển hướng người dùng về trang Ngân hàng câu hỏi `/question-bank`.
- **FR-007**: Hệ thống PHẢI hiển thị một modal xác nhận khi người dùng bấm nút Lưu (Lưu & Tạo tiếp hoặc Lưu & Quay lại). Modal này cho phép:
  - Chọn lưu câu hỏi vào một bộ sưu tập (Collection) hiện có của họ.
  - Hoặc tạo trực tiếp một bộ sưu tập mới và lưu câu hỏi vào đó.
  - Hoặc chọn không lưu vào bộ sưu tập nào (chỉ lưu câu hỏi tự do).

### Database Integration (Sử dụng DB hiện có)

- **lms_questions**: Lưu thông tin câu hỏi chính (`statement`, `content`, `question_type`, `question_difficulty`, `grade`, `hint`, `teacher_owned_by_id`).
- **lms_options**: Lưu thông tin các phương án của câu trắc nghiệm, đúng/sai, điền khuyết (`content`, `weight`, `order`).
- **lms_topics_questions**: Liên kết câu hỏi với các node chủ đề trên cây đệ quy (`topic_id`, `question_id`).
- **lms_questions_tags**: Liên kết câu hỏi với các thẻ tag (`tag_id`, `question_id`).
- **lms_collections**: Lưu trữ bộ sưu tập câu hỏi (`title`, `created_by_id`).
- **lms_questions_collections**: Lưu trữ liên kết giữa câu hỏi và bộ sưu tập (`collection_id`, `question_id`).

---

## Success Criteria *(mandatory)*

- **SC-001**: Form tạo câu hỏi đáp ứng mượt mà khi người dùng thay đổi loại câu hỏi (thời gian chuyển đổi form đáp án < 50ms).
- **SC-002**: Việc lưu câu hỏi thủ công bao gồm đầy đủ tùy chọn đáp án, cây chủ đề và tags hoàn tất trong vòng dưới 400ms.
- **SC-003**: Trình soạn thảo `VditorEditor` hiển thị chính xác và không bị lỗi tràn khung hình hoặc vỡ layout trên các độ phân giải màn hình thông dụng (>= 1280px).
- **SC-004**: Người dùng có thể gắn nhãn phân loại học thuật nhanh chóng ở cột bên phải mà không bị gián đoạn quá trình viết đề bài bên cột trái.
- **SC-005**: Modal bộ sưu tập hiển thị mượt mà và cho phép chuyển đổi linh hoạt giữa việc chọn bộ sưu tập sẵn có hoặc nhập tên bộ sưu tập mới.
