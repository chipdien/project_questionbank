# Tiến độ dự án: Tạo bản sao tài liệu tùy chỉnh (013-duplicate-document)

- [x] **Task 1: Cập nhật Database Schema & Chạy Migration**
  - [x] Step 1: Cập nhật file `prisma/schema.prisma` thêm cột `copied_from_id` và index.
  - [x] Step 2: Chạy migration để cập nhật database (`npx prisma db push`).
- [x] **Task 2: Phát triển Server Action nhân bản sâu (Deep Copy)**
  - [x] Step 1: Viết server action `duplicateDocumentAction` trong file `src/lib/actions/document-library.action.ts` thực hiện deep copy document, deep copy câu hỏi, options, các quan hệ tag, topic, lesson và lưu vào database.
- [x] **Task 3: Tích hợp Giao diện Nút Tạo Bản Sao**
  - [x] Step 1: Cập nhật component `DocumentItem` trong `QuestionBankManager.tsx` hiển thị nút nhân bản khi xem file public của người khác.
  - [x] Step 2: Định nghĩa logic action duplicate trong `useQuestionBank.ts` để gọi server action, xử lý loading, toast thông báo và reload danh sách.
