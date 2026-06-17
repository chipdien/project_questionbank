# Feature Specification: Luồng Yêu cầu Sửa / Phân loại / Báo lỗi Câu hỏi (Question Requests)

**Feature Branch**: `011-question-requests`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "Giai đoạn tiếp theo: giáo viên gửi request đề xuất sửa, phân loại câu hỏi, báo lỗi. 2 role Admin và Giáo viên (non-admin). Giáo viên chỉ xem, không edit trực tiếp, nhưng gửi được request sửa/phân loại/báo lỗi + thêm vào collection. Admin: xem câu có request (ưu tiên lên đầu), duyệt đề xuất, edit câu hỏi. Bảng lms_requests đã có sẵn."

## Tổng quan

Xây dựng luồng **yêu cầu (request)** cho phép **giáo viên (non-admin)** đề xuất thay đổi trên câu hỏi mà không có quyền sửa trực tiếp, và **admin** xét duyệt. Có 3 loại request: **EDIT** (đề xuất sửa nội dung), **CLASSIFY** (đề xuất phân loại), **REPORT** (báo lỗi/đề sai kèm gợi ý). "Thêm vào collection" là thao tác trực tiếp (đã có sẵn), không qua duyệt.

Dữ liệu lưu vào bảng **`lms_requests`** có sẵn (đang trống, chưa dùng), bổ sung 3 cột: `question_id`, `status`, `admin_note`.

Tính năng này nối tiếp `010-page-list`: điểm vào của giáo viên là modal chi tiết trên `/question-list`; đồng thời mở rộng `getAllQuestions` để ưu tiên câu có request cho admin. Xem [cross-reference với 010](#liên-quan-tới-010-page-list).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Giáo viên gửi đề xuất phân loại (Priority: P1)

Là giáo viên, tôi muốn đề xuất phân loại (khối lớp, chủ đề, tags) cho một câu hỏi chưa/được phân loại sai, để admin xem xét và áp dụng.

**Independent Test**: Mở chi tiết một câu hỏi trên `/question-list`, bấm "Đề xuất phân loại", chọn khối 10 + 1 chủ đề + vài tag + ghi chú, gửi. Kiểm tra request xuất hiện trong danh sách request của câu (trạng thái `PENDING`).

**Acceptance Scenarios**:
1. **Given** giáo viên ở modal chi tiết câu hỏi, **When** gửi đề xuất `CLASSIFY` với khối/chủ đề/tags, **Then** tạo bản ghi `lms_requests` với `type='CLASSIFY'`, `status='PENDING'`, `content_suggest` = JSON `{grade, topicIds, tagIds}`, `created_by_id` = giáo viên.
2. **Given** giáo viên vừa gửi, **When** xem lại modal, **Then** thấy request của mình kèm trạng thái `PENDING` và nút "Hủy".

---

### User Story 2 - Giáo viên đề xuất sửa / báo lỗi (Priority: P1)

Là giáo viên, tôi muốn đề xuất sửa nội dung câu hỏi hoặc báo câu hỏi sai kèm gợi ý.

**Independent Test**: Gửi một `EDIT` (đề bài mới + lý do) và một `REPORT` (mô tả lỗi + gợi ý); kiểm tra cả hai lưu đúng loại và hiển thị.

**Acceptance Scenarios**:
1. **Given** giáo viên mở "Đề xuất sửa", **When** nhập nội dung đề xuất mới + lý do và gửi, **Then** lưu `type='EDIT'`, `content_suggest`=nội dung mới, `content`=lý do.
2. **Given** giáo viên mở "Báo lỗi", **When** nhập mô tả lỗi + gợi ý và gửi, **Then** lưu `type='REPORT'`, `content`=mô tả+gợi ý.

---

### User Story 3 - Giáo viên hủy request của mình (Priority: P2)

Là giáo viên, tôi muốn hủy một request đang chờ nếu gửi nhầm.

**Acceptance Scenarios**:
1. **Given** một request `PENDING` của tôi, **When** bấm "Hủy", **Then** `status='CANCELLED'`; không còn hiện ở hàng đợi admin.
2. **Given** một request đã `APPROVED`/`REJECTED`, **When** xem, **Then** không có nút "Hủy".

---

### User Story 4 - Admin duyệt / từ chối request (Priority: P1)

Là admin, tôi muốn xem các request (ưu tiên `PENDING`), áp dụng đề xuất hoặc từ chối kèm lý do.

**Independent Test**: Vào `/requests`, mở một `CLASSIFY` `PENDING`, bấm "Áp dụng & duyệt", xác nhận câu hỏi được phân loại và request chuyển `APPROVED`. Mở một request khác, "Từ chối" kèm lý do, xác nhận `REJECTED` + `admin_note`.

**Acceptance Scenarios**:
1. **Given** admin ở `/requests`, **When** mở danh sách, **Then** request `PENDING` hiển thị trên đầu, có lọc theo loại/trạng thái.
2. **Given** admin mở một `CLASSIFY` `PENDING`, **When** "Áp dụng & duyệt", **Then** form phân loại pre-fill từ đề xuất → gọi `classifyQuestions` cập nhật câu hỏi → `approveQuestionRequest` đặt `status='APPROVED'`, `updated_by_id`=admin.
3. **Given** admin mở một `EDIT` `PENDING`, **When** "Áp dụng & duyệt", **Then** form sửa pre-fill đề xuất → `PATCH /api/questions/[id]` → `approveQuestionRequest`.
4. **Given** admin mở bất kỳ request `PENDING`, **When** "Từ chối" + nhập lý do, **Then** `status='REJECTED'`, `admin_note`=lý do.
5. **Given** một request đã rời `PENDING`, **When** admin mở lại, **Then** các nút duyệt/từ chối bị khóa.

---

### User Story 5 - Ưu tiên câu có request trên danh sách & badge chuông (Priority: P2)

Là admin, tôi muốn câu hỏi có request chờ xử lý nổi lên đầu danh sách và thấy số lượng chờ trên icon chuông.

**Acceptance Scenarios**:
1. **Given** admin ở `/question-list`, **When** tải danh sách, **Then** câu có request `PENDING` lên đầu kèm badge "N yêu cầu".
2. **Given** có request `PENDING`, **When** admin xem header, **Then** icon chuông hiển thị badge số request `PENDING`; bấm → `/requests`.
3. **Given** giáo viên xem header, **When** có request `PENDING` của họ, **Then** badge chuông = số request `PENDING` của chính họ.

---

### Edge Cases

- Một câu có nhiều request (nhiều giáo viên / nhiều loại) → đều cho phép & hiển thị tất cả.
- Approve/reject chỉ áp dụng cho request `PENDING`; đã xử lý thì khóa thao tác.
- `question_id` không có FK (relationMode prisma) → câu hỏi đã xóa thì hiển thị "Câu hỏi không tồn tại", không vỡ trang.
- `content_suggest` của `CLASSIFY` parse JSON lỗi → hiển thị "đề xuất không hợp lệ", không vỡ modal.
- Giáo viên không được gọi action admin (kiểm tra ở server) dù có cố gọi trực tiếp.
- Hủy chỉ cho phép chủ sở hữu + chỉ khi `PENDING`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Schema): Bổ sung vào `lms_requests` 3 cột: `question_id BigInt?` (index), `status VarChar(50)` default `'PENDING'` (index), `admin_note` LongText nullable. KHÔNG sửa/xóa cột cũ. Migration phải được tài liệu hóa (xem `data-model.md`).
- **FR-002** (Loại request): hỗ trợ 3 loại lưu ở cột `type`: `EDIT`, `CLASSIFY`, `REPORT`.
- **FR-003** (Trạng thái): `status ∈ {PENDING, APPROVED, REJECTED, CANCELLED}`, mặc định `PENDING`.
- **FR-004** (Phân bổ dữ liệu):
  - `CLASSIFY`: `content_suggest` = JSON `{grade:number|null, topicIds:number[], tagIds:number[]}`, `content` = ghi chú.
  - `EDIT`: `content_suggest` = nội dung đề bài/đáp án đề xuất (text), `content` = lý do.
  - `REPORT`: `content` = mô tả lỗi + gợi ý (text).
- **FR-005** (Tạo request): action `createQuestionRequest` cho mọi user đăng nhập; set `created_by_id`=user, `status='PENDING'`; validate `type`.
- **FR-006** (Hủy): action `cancelQuestionRequest` chỉ cho chủ sở hữu và chỉ khi `PENDING` → `CANCELLED`.
- **FR-007** (Duyệt): action `approveQuestionRequest` (admin) → `APPROVED`, `updated_by_id`=admin; chỉ khi đang `PENDING`.
- **FR-008** (Từ chối): action `rejectQuestionRequest(id, reason)` (admin) → `REJECTED`, `admin_note`=reason, `updated_by_id`=admin; chỉ khi đang `PENDING`.
- **FR-009** (Áp dụng đề xuất): KHÔNG viết action ghi câu hỏi mới — tái dùng `classifyQuestions` (CLASSIFY) và `PATCH /api/questions/[id]` (EDIT). Sau khi áp dụng thành công mới gọi `approveQuestionRequest`.
- **FR-010** (Danh sách request): action `getQuestionRequests({types?, statuses?}, page, pageSize)` — admin xem tất cả, non-admin chỉ của mình; sắp `PENDING` lên đầu rồi `created_at` desc; trả kèm trích đoạn câu hỏi + tên người gửi.
- **FR-011** (Request theo câu hỏi): action `getRequestsForQuestion(questionId)` — admin tất cả, giáo viên của mình; dùng trong modal chi tiết.
- **FR-012** (Đếm cho chuông): action `getPendingRequestCount()` — admin = tổng `PENDING`; non-admin = số `PENDING` của chính họ.
- **FR-013** (Trang `/requests`): route dùng chung, phân quyền theo role. Admin: liệt kê tất cả + lọc loại/trạng thái + `RequestReviewModal` (áp dụng/duyệt/từ chối). Giáo viên: chỉ request của mình + nút "Hủy" cho `PENDING`.
- **FR-014** (Modal chi tiết trên `/question-list`): thay `QuestionModal` bằng `QuestionDetailModal` mới (tái dùng util render markdown/math). Giáo viên: 4 nút "Đề xuất sửa / Đề xuất phân loại / Báo lỗi / Thêm vào collection" + danh sách request của mình trên câu + nút hủy. Admin: xem tất cả request của câu + duyệt/từ chối/áp dụng + sửa/phân loại trực tiếp (tái dùng `QuestionEditModal` + `classifyQuestions`).
- **FR-015** (`RequestSubmitModal`): 1 component 3 chế độ (`EDIT`/`CLASSIFY`/`REPORT`) như mô tả FR-004; dùng component dùng chung (`AppSelect`, `topic-tree-select`, bộ chọn tags).
- **FR-016** (Ưu tiên admin trên `/question-list`): mở rộng `getAllQuestions` thêm cờ `prioritizeRequests` (bật khi admin) → trả `pendingRequestCount` mỗi câu và đẩy câu có request `PENDING` lên đầu (phân trang 2 đoạn). Hành vi non-admin giữ nguyên.
- **FR-017** (Badge chuông header): thay chấm đỏ tĩnh trong `TopNavBar` bằng badge số từ `getPendingRequestCount()`; bấm chuông → `/requests`.
- **FR-018** (Sidebar): thêm mục "Yêu cầu" → `/requests` (mọi user). KHÔNG đặt badge ở sidebar (badge chỉ ở chuông).
- **FR-019** (Phân quyền server): mọi action kiểm tra quyền ở server; giáo viên không thể duyệt/từ chối/sửa trực tiếp; admin = `level_rank >= 5`.

### Out of Scope (đợt này)

- Cơ chế "đã đọc / đã xem thông báo" cho giáo viên (badge giáo viên tạm = số `PENDING` của họ).
- "Duyệt câu" (kiểm duyệt bản thân câu hỏi qua trường trạng thái) — để sau.
- Thông báo realtime / email.
- Lọc "năm học".

### Key Entities

- **lms_requests**: thực thể chính của luồng (sau khi thêm `question_id`, `status`, `admin_note`).
- **lms_questions**: đối tượng bị nhắm tới; áp dụng EDIT/CLASSIFY qua API/action sẵn có.
- **lms_topics / lms_tags / lms_difficulties**: dùng trong form phân loại của `CLASSIFY`.
- **lms_users**: tên người gửi / người xử lý.

## Success Criteria *(mandatory)*

- **SC-001**: Giáo viên gửi được cả 3 loại request và thấy trạng thái của chúng; không có nút sửa trực tiếp câu hỏi.
- **SC-002**: Admin duyệt `CLASSIFY`/`EDIT` thì câu hỏi được cập nhật đúng và request chuyển `APPROVED`; từ chối lưu đúng lý do.
- **SC-003**: Câu có request `PENDING` luôn nổi lên đầu `/question-list` của admin và mất ưu tiên sau khi xử lý.
- **SC-004**: Badge chuông phản ánh đúng số `PENDING` theo role.
- **SC-005**: 100% action chặn đúng quyền (giáo viên không duyệt/sửa trực tiếp được kể cả gọi thẳng action).

## Assumptions

- `lms_requests` đang trống, an toàn để thêm cột và dùng cho mục đích này.
- Admin xác định bằng `level_rank >= 5` (nhất quán với phần còn lại của dự án).
- `classifyQuestions` và `PATCH /api/questions/[id]` đủ để áp dụng đề xuất CLASSIFY/EDIT.

## Liên quan tới 010-page-list

Tính năng này **chỉnh sửa các thành phần của 010**:
- Mở rộng `getAllQuestions` (`prioritizeRequests`, `pendingRequestCount`) — FR-016.
- Thay `QuestionModal` bằng `QuestionDetailModal` mới trên `/question-list` — FR-014.

Spec `010-page-list` được cập nhật ghi chú trỏ sang `011` ở các mục tương ứng để tránh lệch tài liệu.
