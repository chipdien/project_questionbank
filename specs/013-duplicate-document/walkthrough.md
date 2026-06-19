# Walkthrough - Tạo bản sao tài liệu tùy chỉnh (013-duplicate-document)

Chúng ta đã hoàn thành phát triển tính năng tạo bản sao tài liệu tùy chỉnh cho màn `/question-bank`.

## Các thay đổi đã thực hiện

### 1. Database Schema (`prisma/schema.prisma`)
- Thêm cột `copied_from_id BigInt?` vào model `lms_documents` để lưu trữ nguồn gốc của tài liệu được nhân bản.
- Tạo index `idx_lms_documents_copied_from_id` trên cột mới để tối ưu hóa truy vấn kiểm tra trùng lặp bản sao.
- Chạy lệnh `npx prisma db push` đồng bộ thành công cấu trúc database.

### 2. Server Action Backend (`src/lib/actions/document-library.action.ts`)
- Thêm server action `duplicateDocumentAction(docId: number)` để thực hiện:
  - Kiểm tra xem người dùng hiện tại đã tạo bản sao của tài liệu này từ trước chưa. Nếu đã có bản sao, trả về ID bản sao cũ để chuyển hướng.
  - Sử dụng Prisma Transaction để thực hiện Deep Copy (nhân bản sâu):
    - Copy bản ghi tài liệu mới có `title` có tiền tố `"Bản sao - "` và gán quyền sở hữu (`created_by_id`, `teacher_owned`) cho user hiện tại.
    - Copy sâu tất cả các câu hỏi thuộc tài liệu gốc (bao gồm cả các câu hỏi phụ `complex = 'sub'`). Map chính xác `ref_question_id` từ câu hỏi phụ sang ID câu hỏi cha mới nhân bản.
    - Copy sâu các tùy chọn câu hỏi (`lms_options`).
    - Copy sâu các quan hệ học tập đi kèm (`lms_questions_tags`, `lms_topics_questions`, `lms_questions_lessons`).
    - Tạo liên kết quan hệ trong bảng `lms_questions_documents` với tài liệu mới.

### 3. Frontend & Logic UX (`src/app/(main)/question-bank/`)
- **`page.tsx`**: Lấy `userId` từ session user hiện tại và truyền làm prop `currentUserId` cho `QuestionBankManager`.
- **`hooks/useQuestionBank.ts`**:
    - Thêm state `isDuplicating` để quản lý trạng thái loading khi đang thực hiện nhân bản.
    - Thêm hàm `handleDuplicateDoc` để gọi server action, hiển thị toast thông báo phù hợp (Tạo bản sao mới thành công hoặc Đã tồn tại bản sao từ trước và đang chuyển hướng) đồng thời cập nhật view và refresh danh sách tài liệu.
- **`components/QuestionBankManager.tsx`**:
    - Nhận prop `currentUserId` và truyền tiếp xuống component con `DocumentItem`.
    - Cập nhật component `DocumentItem` thay vì thẻ `button` bọc ngoài cùng (gây lỗi HTML button lồng button khi chèn thêm nút duplicate) thành thẻ `div` với hiệu ứng `cursor-pointer`.
    - Thêm nút "Tạo bản sao" (sử dụng icon `content_copy`) vào cạnh tên các tài liệu. Nút này chỉ hiển thị khi tài liệu là Public (`doc.public === '1'`) và không phải do chính user hiện tại sở hữu.

## Hướng dẫn kiểm thử thủ công (Manual Verification)
1. Đăng nhập bằng tài khoản Giáo viên thường (non-admin).
2. Vào màn `/question-bank`, chọn tab **DANH SÁCH TỆP**.
3. Chọn một tài liệu Public do giáo viên khác sở hữu -> Xác nhận thấy nút "Tạo bản sao" xuất hiện.
4. Bấm nút "Tạo bản sao" lần đầu tiên:
   - Xác nhận có màn hình loading nhẹ (icon quay tròn).
   - Xác nhận toast "Tạo bản sao tài liệu thành công!".
   - Xác nhận hệ thống reload danh sách tệp, tự động chọn tài liệu bản sao mới tạo đó (tên có tiền tố `Bản sao - `).
5. Quay lại tài liệu Public gốc ban đầu, bấm nút "Tạo bản sao" lần thứ 2:
   - Xác nhận toast "Bạn đã tạo bản sao cho tài liệu này từ trước. Đang chuyển hướng...".
   - Xác nhận hệ thống tự động chọn tài liệu bản sao đã tạo từ trước.
6. Thử chỉnh sửa một câu hỏi bất kỳ trong tài liệu bản sao vừa nhân bản -> Xác nhận cập nhật thành công và không ảnh hưởng tới nội dung câu hỏi trong tài liệu Public gốc ban đầu.
