# Feature Specification: Trang Danh sách Câu hỏi (Question List)

**Feature Branch**: `010-page-list`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "Làm chức năng hiển thị danh sách toàn bộ câu hỏi trong database (trừ câu private), có phân trang 50 câu/trang, lọc theo khối lớp, chủ đề, loại bài, tags, câu chưa phân loại. Bộ lọc dạng header ở đầu trang, bảng câu hỏi + phân trang bên dưới. Là một màn mới, tab con của nhóm 'Xử lý tài liệu'."

> **Cập nhật bởi `011-question-requests`:** Tính năng request chỉnh sửa một số phần của trang này:
> - `getAllQuestions` được mở rộng thêm `options.prioritizeRequests` + `pendingRequestCount` (đẩy câu có request `PENDING` lên đầu cho admin).
> - Modal "Xem chi tiết" (vốn dùng `QuestionModal`) được thay bằng `QuestionDetailModal` mới (role-aware, kèm nút gửi đề xuất / khu vực duyệt).
> Xem `specs/011-question-requests/` để biết chi tiết.

## Tổng quan

Một trang mới **"Danh sách câu hỏi"** (`/question-list`), là mục con thứ ba trong submenu **"Xử lý tài liệu"** của sidebar (cạnh "Tạo thủ công" và "Import tài liệu"). Trang hiển thị **toàn bộ câu hỏi trong database** (loại trừ câu private theo quy tắc phân quyền), có bộ lọc dạng **header ngang ở đầu trang** và một **bảng câu hỏi read-only có phân trang 50 câu/trang** bên dưới.

Trang này **độc lập** với trang `/question-bank` hiện có (vốn xoay quanh tài liệu và quy trình phân loại). Trang Question Bank giữ nguyên, không bị ảnh hưởng. Trang mới phục vụ nhu cầu **duyệt nhanh toàn bộ ngân hàng câu hỏi** và là nền tảng cho workflow tương lai (giáo viên gửi đề xuất phân loại → admin nhận và phân loại theo gợi ý).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Duyệt toàn bộ danh sách câu hỏi (Priority: P1)

Là một người dùng (giáo viên hoặc admin), tôi muốn xem danh sách toàn bộ câu hỏi trong hệ thống (trừ câu private không thuộc về tôi), phân trang 50 câu mỗi trang, để nắm được kho câu hỏi hiện có.

**Why this priority**: Đây là chức năng cốt lõi của trang — không có danh sách thì các bộ lọc vô nghĩa.

**Independent Test**: Truy cập `/question-list`, thấy bảng câu hỏi với 50 dòng đầu tiên, thanh phân trang hiển thị đúng tổng số câu hỏi mà người dùng được phép xem.

**Acceptance Scenarios**:

1. **Given** người dùng đăng nhập truy cập `/question-list`, **When** trang tải xong, **Then** bảng hiển thị tối đa 50 câu hỏi mỗi trang kèm phân trang, sắp xếp mặc định theo `id` giảm dần (mới nhất trước).
2. **Given** non-admin đang xem danh sách, **When** hệ thống truy vấn, **Then** chỉ hiển thị câu `public='1'`, câu `public IS NULL`, và câu do người dùng sở hữu; câu private (`public='0'`) của người khác bị ẩn.
3. **Given** admin đang xem danh sách, **When** hệ thống truy vấn, **Then** hiển thị tất cả câu hỏi kể cả private (`public='0'`).

---

### User Story 2 - Lọc câu hỏi theo nhiều tiêu chí (Priority: P1)

Là một người dùng, tôi muốn lọc danh sách theo khối lớp, chủ đề, hình thức câu hỏi, tags và trạng thái "chưa phân loại" thông qua một bộ lọc dạng header ở đầu trang, để nhanh chóng thu hẹp danh sách.

**Why this priority**: Với hàng chục nghìn câu hỏi, lọc là điều kiện bắt buộc để trang hữu dụng.

**Independent Test**: Chọn Khối lớp 10 + một Chủ đề cha + bật toggle "Chỉ hiện chưa phân loại", kiểm tra danh sách chỉ còn các câu thỏa mãn đồng thời các tiêu chí.

**Acceptance Scenarios**:

1. **Given** người dùng chọn một chủ đề cha, **When** áp dụng lọc, **Then** danh sách trả về cả câu hỏi thuộc chủ đề đó và toàn bộ chủ đề con cháu (so khớp `path`).
2. **Given** người dùng chọn nhiều tag, **When** áp dụng lọc, **Then** hệ thống lọc OR trong cùng category và AND giữa các category.
3. **Given** người dùng bật toggle "Chỉ hiện chưa phân loại", **When** áp dụng lọc, **Then** danh sách chỉ còn các câu **chưa có chủ đề HOẶC chưa có tag**.
4. **Given** người dùng thay đổi bất kỳ bộ lọc nào, **When** lọc được áp dụng, **Then** phân trang tự reset về trang 1 và tổng số kết quả cập nhật đúng.

---

### User Story 3 - Tìm kiếm từ khóa kết hợp bộ lọc (Priority: P2)

Là một người dùng, tôi muốn gõ từ khóa để tìm trong nội dung câu hỏi, kết hợp với các bộ lọc đang chọn.

**Why this priority**: Tăng tốc tìm kiếm khi nhớ một vài từ trong đề bài.

**Independent Test**: Gõ "parabol" + chọn Khối lớp 12, kiểm tra danh sách chỉ gồm câu lớp 12 chứa "parabol".

**Acceptance Scenarios**:

1. **Given** người dùng nhập từ khóa và đang áp dụng bộ lọc, **When** tìm kiếm chạy (debounce), **Then** kết quả khớp cả từ khóa (trên `statement` và `content`) lẫn các tiêu chí lọc.

---

### User Story 4 - Xem chi tiết câu hỏi (Priority: P2)

Là một người dùng, tôi muốn bấm "Xem chi tiết" trên một dòng để xem đầy đủ nội dung câu hỏi và đáp án trong một modal read-only.

**Independent Test**: Bấm "Xem chi tiết" trên một dòng, modal mở ra hiển thị đầy đủ statement, đáp án, phân loại; không có chức năng sửa.

**Acceptance Scenarios**:

1. **Given** người dùng ở danh sách, **When** bấm "Xem chi tiết", **Then** modal (`QuestionModal`) mở ở chế độ chỉ đọc hiển thị đầy đủ nội dung câu hỏi.

---

### Edge Cases

- **Câu hỏi chùm**: chỉ hiển thị câu độc lập và câu chùm cha (`complex != 'sub'` hoặc null); câu con (`complex='sub'`) được gộp vào câu cha qua `ref_question_id`, không hiển thị rời.
- **Không có kết quả**: hiển thị empty state kèm nút "Xóa bộ lọc".
- **Đổi bộ lọc**: phân trang reset về trang 1.
- **`public IS NULL`**: coi là "chưa đánh dấu" → hiển thị với mọi người (không phải private).
- **Trang vượt giới hạn**: nếu `page` lớn hơn `totalPages`, trả về trang cuối hợp lệ (hoặc danh sách rỗng + phân trang đúng).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cung cấp route mới `/question-list` (`src/app/(main)/question-list/page.tsx`) và thêm mục con "Danh sách câu hỏi" vào submenu "Xử lý tài liệu" trong `Sidebar.tsx`, đồng thời cập nhật điều kiện auto-mở submenu để bao gồm `/question-list`.
- **FR-002**: Hệ thống PHẢI cung cấp Server Action mới `getAllQuestions` trong **file riêng** `src/actions/question-list.ts` (KHÔNG thêm vào `question.ts`), quét trực tiếp bảng `lms_questions` (không join qua `lms_documents`).
- **FR-003**: `getAllQuestions` PHẢI phân trang mặc định **50 câu/trang** và trả về `{ questions, pagination: { total, page, pageSize, totalPages } }`.
- **FR-004** (Phân quyền hiển thị):
  - Admin (`level_rank >= 5`): thấy **tất cả** câu hỏi, kể cả private (`public='0'`).
  - Non-admin: thấy câu `public='1'` HOẶC `public IS NULL` HOẶC câu do mình sở hữu (`created_by_id` HOẶC `owned_by_id` HOẶC `teacher_owned_by_id` khớp user). Câu private của người khác bị ẩn.
- **FR-005**: Hệ thống PHẢI loại câu hỏi con chùm khỏi danh sách chính (`complex != 'sub'` hoặc null) và gộp câu con vào câu cha qua `ref_question_id`.
- **FR-006** (Bộ lọc): `getAllQuestions` PHẢI hỗ trợ các tham số lọc: `grades[]` (khối lớp), `questionTypes[]` (hình thức câu hỏi), `topicIds[]` (lọc đệ quy theo `path`), `tagIds[]` (OR trong category, AND giữa category), `keyword` (tìm trên `statement`/`content`), `unclassified` (boolean).
- **FR-007** ("Chưa phân loại"): khi `unclassified=true`, chỉ trả về câu **không có** bản ghi trong `lms_topics_questions` **HOẶC** không có trong `lms_questions_tags`.
- **FR-008** (Lọc đệ quy chủ đề): khi chọn một chủ đề, hệ thống PHẢI trả cả câu hỏi của các chủ đề con cháu (so khớp `path` bắt đầu bằng `path` của chủ đề được chọn).
- **FR-009** (Phân tách loại): bộ lọc PHẢI tách rõ "Hình thức câu hỏi" (`question_type`: trắc nghiệm 1 đáp án, nhiều đáp án, đúng/sai, điền khuyết, tự luận) với các tag nhóm TYPE (lý thuyết/vận dụng) — tag TYPE nằm trong khu vực lọc tags.
- **FR-010** (Giao diện header): bộ lọc PHẢI hiển thị dạng header ngang ở đầu trang, ưu tiên component dùng chung: `AppSelect` (khối lớp, hình thức), `topic-tree-select` (chủ đề), một ô tag tổng hợp đa chọn gom nhóm theo category, ô tìm kiếm từ khóa, toggle "Chỉ hiện chưa phân loại", nút "Xóa bộ lọc".
- **FR-011** (Bảng): bảng read-only PHẢI hiển thị các cột: ID/mã, Nội dung (rút gọn `statement`), Khối lớp, Độ khó (badge màu từ `lms_difficulties`), Hình thức, Chủ đề, Tags, **Người tạo**, **Ngày tạo**, Trạng thái phân loại, và nút "Xem chi tiết".
- **FR-012** (Người tạo): cột "Người tạo" PHẢI hiển thị tên người tạo (`nickname || username` từ `lms_users`, join theo `created_by_id`); để trống nếu không xác định.
- **FR-013** (Xem chi tiết): nút "Xem chi tiết" PHẢI mở `QuestionModal` ở chế độ read-only. Giai đoạn này KHÔNG có chức năng sửa/phân loại trên trang.
- **FR-014** (URL state): trạng thái bộ lọc và số trang PHẢI được đồng bộ lên URL query params để chia sẻ/quay lại được; đổi bộ lọc reset trang về 1.
- **FR-015** (Tái sử dụng logic): logic resolve chủ đề đệ quy và gom tag theo category PHẢI tách thành helper dùng chung `src/lib/services/question-filters.ts`; `question-list.ts` import dùng. `getLibraryQuestions` trong `question.ts` giữ nguyên, không refactor.

### Out of Scope (giai đoạn này)

- Chức năng phân loại / sửa câu hỏi trực tiếp trên trang danh sách.
- Workflow giáo viên gửi đề xuất phân loại → admin duyệt (sẽ làm sau, trang này là nền tảng).
- Bộ lọc theo "năm học" (tạm bỏ).
- Chọn nhiều câu / thêm vào collection (đó là chức năng của trang Question Bank).

### Key Entities *(include if feature involves data)*

- **lms_questions**: thực thể chính. Trường dùng: `id`, `statement`, `content`, `grade`, `question_difficulty`, `question_type`, `complex`, `ref_question_id`, `public`, `created_by_id`, `owned_by_id`, `teacher_owned_by_id`, `created_at`, `code`.
- **lms_topics / lms_topics_questions**: chủ đề phân cấp (`path`) và liên kết câu hỏi–chủ đề.
- **lms_tags / lms_questions_tags**: tag theo `category` và liên kết câu hỏi–tag.
- **lms_difficulties**: tên + mã màu của các mức độ khó.
- **lms_users**: lấy tên người tạo (`nickname`, `username`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: API `getAllQuestions` phản hồi < 500ms khi áp dụng bộ lọc trên DB ~33.000 câu hỏi (phân trang 50 câu).
- **SC-002**: 100% câu hỏi thuộc chủ đề con cháu hiển thị đúng khi chọn lọc chủ đề cha.
- **SC-003**: Phân quyền hiển thị đúng 100%: non-admin không bao giờ thấy câu private của người khác; admin thấy tất cả.
- **SC-004**: Bộ lọc "chưa phân loại" trả đúng tập câu thiếu chủ đề HOẶC thiếu tag.
- **SC-005**: Trạng thái bộ lọc khôi phục đúng khi tải lại trang từ URL.

## Assumptions

- Các index trên `lms_questions.public`, `grade`, `question_type`, `complex`, `lms_topics.path`, `lms_tags.category` đủ tốt cho truy vấn lọc.
- Cây `lms_topics` đã có `path` hợp lệ phục vụ lọc đệ quy.
- `QuestionModal`, `AppSelect`, `topic-tree-select`, `AppBadge` hiện có đủ dùng cho nhu cầu hiển thị/lọc của trang.
- Giá trị `public`: `'1'` = công khai (~31k), `'0'` = private (~1.8k), `null` = chưa đánh dấu (~524).
