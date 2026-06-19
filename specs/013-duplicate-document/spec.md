# Feature Specification: Tạo bản sao tài liệu tùy chỉnh (Duplicate Document)

**Feature Branch**: `013-duplicate-document`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "tôi muốn làm chức năng tạo bản sao document cho màn /question-bank, logic là user xem được các file public do người khác tải lên (mặc định không thể sửa các câu hỏi trong file đấy) nhưng user muốn sửa, thì phải click vào nút tạo bản sao -> lập tức tạo 1 bản sao với người sở hữu chính là user đã tạo bản sao đó (nếu đã có bản sao trước đó thì thông báo và chuyển đến document đó) và user có thể thoải mái chỉnh sửa các câu hỏi trong tệp bản sao mới này (các câu hỏi trong bản sao này sẽ mặc định là các câu hỏi mới với người tạo hay người sở hữu (teacher_owner_id) chính là người vừa tạo bản sao"

## Tổng quan

Tính năng này giúp **Giáo viên (non-admin)** có thể nhân bản một tài liệu công khai (Public) của người khác tải lên để tự do chỉnh sửa các câu hỏi bên trong tài liệu đó mà không ảnh hưởng đến dữ liệu gốc. 

Logic chính bao gồm:
1. Thêm cột `copied_from_id` vào bảng `lms_documents` để lưu vết nguồn gốc bản sao.
2. Kiểm tra xem người dùng hiện tại đã tạo bản sao cho tài liệu gốc đó chưa.
3. Nếu **đã có**, hiển thị thông báo toast và tự động chuyển hướng hoặc tải tài liệu bản sao đó trên giao diện màn `/question-bank`.
4. Nếu **chưa có**, thực hiện nhân bản sâu (Deep Copy):
   * Nhân bản bản ghi tài liệu (`lms_documents`) với `created_by_id` và `teacher_owned` gán cho ID của user hiện tại.
   * Nhân bản tất cả các câu hỏi thuộc tài liệu đó (bảng `lms_questions`), bao gồm cả câu hỏi phụ (`complex = 'sub'`), đặt `teacher_owned_by_id` và `owned_by_id` bằng ID của user hiện tại.
   * Nhân bản tất cả các tùy chọn câu hỏi (`lms_options`) tương ứng.
   * Liên kết các câu hỏi mới nhân bản với tài liệu mới trong bảng quan hệ `lms_questions_documents` và `lms_questions_lessons` / `lms_questions_tags` / `lms_topics_questions`.

## User Scenarios & Testing

### User Story 1 - Kích hoạt Tạo bản sao tài liệu Public từ danh sách (Priority: P1)
Là giáo viên, khi tôi xem danh sách tài liệu công khai của người khác tải lên và không có quyền sửa câu hỏi trực tiếp, tôi muốn thấy nút "Tạo bản sao" để nhân bản tài liệu.

**Acceptance Scenarios**:
1. **Given** Tôi đang ở màn `/question-bank` và chọn một tài liệu công khai do giáo viên khác sở hữu.
2. **When** Nút "Tạo bản sao" hiển thị cạnh tiêu đề tài liệu công khai đó, tôi click vào nút này.
3. **Then** Hệ thống gọi API/Action nhân bản.
4. **And** Nếu nhân bản thành công lần đầu, hệ thống hiển thị thông báo "Đã tạo bản sao thành công", cập nhật lại danh sách tệp của tôi và tự động chọn tài liệu bản sao mới tạo đó.

---

### User Story 2 - Xử lý trùng lặp bản sao (Priority: P1)
Là giáo viên, tôi muốn hệ thống nhận diện nếu tôi đã từng tạo bản sao của tài liệu này từ trước để tránh rác database và giúp tôi quay lại bản copy cũ dễ dàng.

**Acceptance Scenarios**:
1. **Given** Tôi đã từng nhân bản tài liệu `A` thành công thành tài liệu bản sao `A_copy`.
2. **When** Tôi chọn lại tài liệu gốc `A` và bấm nút "Tạo bản sao" lần nữa.
3. **Then** Hệ thống phát hiện đã có bản sao do tôi sở hữu, hiển thị thông báo toast thông tin: "Bạn đã tạo bản sao cho tài liệu này trước đó. Đang chuyển hướng..."
4. **And** Hệ thống tự động chọn tài liệu `A_copy` trên giao diện để tôi tiếp tục làm việc.

---

### User Story 3 - Chỉnh sửa câu hỏi trên bản sao mới (Deep Copy Verification) (Priority: P1)
Là giáo viên, tôi muốn các câu hỏi trong bản sao mới là của riêng tôi sở hữu, để tôi có thể chỉnh sửa tự do mà không ảnh hưởng tới bản gốc của người khác.

**Acceptance Scenarios**:
1. **Given** Tôi nhân bản thành công tài liệu gốc `A` sang tài liệu mới `A_copy`.
2. **When** Tôi kiểm tra các câu hỏi liên kết trong tài liệu `A_copy`.
3. **Then** Các câu hỏi này phải có ID mới và quyền sở hữu `teacher_owned_by_id` bằng ID của tôi.
4. **And** Khi tôi sửa nội dung một câu hỏi trong `A_copy`, câu hỏi tương ứng trong tài liệu gốc `A` vẫn được giữ nguyên không thay đổi.

---

### Edge Cases
- **Tài liệu gốc không có câu hỏi nào**: Cho phép nhân bản tài liệu rỗng bình thường, thông báo thành công.
- **Lỗi trong quá trình Deep Copy (Transaction)**: Nếu quá trình copy câu hỏi hoặc option gặp lỗi, toàn bộ transaction tạo bản sao document và các liên quan phải được rollback để tránh lỗi dữ liệu mồ côi (orphaned questions).
- **Tài liệu gốc là của chính mình sở hữu**: Nút "Tạo bản sao" không hiển thị (hoặc bị disable) vì người dùng đã có toàn quyền chỉnh sửa tài liệu gốc.

## Requirements

### Functional Requirements

* **FR-001 (Schema Update)**: Thêm trường `copied_from_id BigInt?` vào model `lms_documents` trong `prisma/schema.prisma` và thiết lập index cho cột này.
* **FR-002 (Duplicate Server Action/API)**: Xây dựng server action `duplicateDocumentAction(docId: number)` thực hiện:
  1. Kiểm tra session đăng nhập và lấy `userId`.
  2. Tìm kiếm document gốc. Validate sự tồn tại và cờ `public === '1'`.
  3. Kiểm tra xem user hiện tại đã nhân bản tài liệu này trước đó chưa: `prisma.lms_documents.findFirst({ where: { copied_from_id: BigInt(docId), created_by_id: BigInt(userId) } })`.
  4. Nếu đã có bản sao, trả về `{ success: true, alreadyExists: true, docId: duplicatedDoc.id }`.
  5. Nếu chưa có, bắt đầu một database **Transaction**:
     * Tạo bản ghi `lms_documents` mới: sao chép `title` (thêm tiền tố `"Bản sao - "`), `content`, `link_s3`, `link_s3_answer`, đặt `copied_from_id = BigInt(docId)`, `created_by_id = BigInt(userId)`, và `teacher_owned = BigInt(userId)`.
     * Tìm tất cả câu hỏi liên kết với document gốc thông qua bảng `lms_questions_documents`.
     * Thực hiện nhân bản sâu (Deep Copy) từng câu hỏi:
       * Tạo bản ghi `lms_questions` mới: sao chép `statement`, `content`, `complex`, `question_type`, `question_level`, `question_difficulty`, `hint`, `domain_id`, `grade`, `active`, `status`, `code`. Đặt `created_by_id = BigInt(userId)`, `teacher_owned_by_id = BigInt(userId)`, `owned_by_id = BigInt(userId)`.
       * Ánh xạ (Map) ID câu hỏi cũ sang ID câu hỏi mới để xử lý câu hỏi phụ (`complex = 'sub'` có `ref_question_id` trỏ về câu hỏi cha). Cần cập nhật `ref_question_id` của câu hỏi phụ mới trỏ đúng vào ID câu hỏi cha mới.
       * Sao chép các tùy chọn `lms_options` của từng câu hỏi: trỏ `question_id` về ID câu hỏi mới.
       * Sao chép quan hệ liên kết học tập: `lms_questions_lessons`, `lms_questions_tags`, `lms_topics_questions`.
       * Tạo liên kết trong `lms_questions_documents` với ID document mới và các ID câu hỏi mới.
* **FR-003 (UI Button integration)**:
  * Tích hợp nút "Tạo bản sao" (sử dụng icon sao chép hoặc duplicate) kế bên tiêu đề tài liệu trong sidebar danh sách tài liệu (`DocumentItem` trong `QuestionBankManager.tsx`).
  * Chỉ hiển thị nút này nếu: `doc.public === '1'` VÀ `doc.created_by_id !== currentUser.id` VÀ `doc.teacher_owned !== currentUser.id`.
* **FR-004 (State & Redirect Sync)**:
  * Khi click nút tạo bản sao, hiển thị trạng thái loading.
  * Nếu thành công và là bản sao mới tạo: refresh danh sách tài liệu, hiển thị toast thành công và kích hoạt chọn tài liệu mới.
  * Nếu thành công nhưng bản sao đã có từ trước: hiển thị toast thông báo, kích hoạt chuyển hướng chọn tài liệu cũ đó.

## Success Criteria

- **SC-001**: Nhân bản thành công tài liệu public của người khác với toàn bộ câu hỏi và options tương ứng thuộc quyền sở hữu của user clone.
- **SC-002**: Chặn không cho tạo nhiều bản sao từ cùng một tài liệu gốc cho một user. Khi tạo lại sẽ tự động báo và chọn file đã copy từ trước.
- **SC-003**: Người dùng có thể chỉnh sửa các câu hỏi trong tệp bản sao mà không thay đổi câu hỏi của tài liệu gốc.
- **SC-004**: Đảm bảo tính nhất quán dữ liệu (Data Integrity) của các câu hỏi phụ (`complex = 'sub'`) bằng cách map chính xác `ref_question_id` sang ID câu hỏi cha mới nhân bản.
