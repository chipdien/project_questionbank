# Tasks: Thống kê Số lần Sử dụng Câu hỏi trong Đề xuất

**Feature**: `012-export-document` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1 — Database
- [ ] **T001** Sửa `prisma/schema.prisma`: thêm `export_count Int @default(0)` vào model `lms_questions`.
- [ ] **T002** Chạy `npm run prisma:migrate -- --name add_export_count_to_questions` để thực hiện migration và cập nhật schema Client.
- [ ] **T003** Tạo script `scripts/populate-export-count.ts` và chạy bằng `npx tsx scripts/populate-export-count.ts` để đồng bộ số lượng dữ liệu cũ.

## Phase 2 — API Backend
- [ ] **T004** Sửa API `src/app/api/documentcustom/upload-and-save/route.ts`:
  - Trong transaction, sau khi lưu các liên kết của câu hỏi với đề custom, thực hiện tăng `export_count` của các câu hỏi tương ứng lên 1 đơn vị bằng câu lệnh Raw SQL.

## Phase 3 — Frontend UI
- [ ] **T005** Sửa `QuestionListTable.tsx`:
  - Thêm cột "Lượt dùng" và hiển thị giá trị `export_count` cho mỗi câu hỏi.
- [ ] **T006** Sửa `QuestionDetailModal.tsx`:
  - Thêm badge hiển thị "Đã dùng: X lần" vào phần thông tin chung ở đầu modal.
- [ ] **T007** Sửa `QuestionLibrary.tsx`:
  - Thêm badge nhỏ hiển thị "đã dùng X" cho từng câu hỏi trong danh sách chọn biên soạn đề.

## Phase 4 — Cấu hình Header & Lịch sử Đề xuất
- [ ] **T008** Sửa `DocumentBuilder.tsx` & `useDocumentBuilder.ts`:
  - Cho phép cấu hình nhãn loại tài liệu động qua trường `docType`.
- [ ] **T009** Sửa API `/api/documentcustom/list`:
  - Lọc tài liệu theo user đối với người dùng thông thường và lấy tên người tạo cho admin.
- [ ] **T010** Sửa `SavedDocumentsLibrary.tsx` & `useSavedDocumentsLibrary.ts`:
  - Hiển thị badge người export đối với admin.

## Phase 5 — Kiểm thử & Nghiệm thu
- [ ] **T011** Chạy thử dev server với lệnh `npm run dev:light` (hoặc `NODE_OPTIONS=--max-old-space-size=2048 next dev`) để đảm bảo không bị lỗi Out of Memory.
- [ ] **T012** Tạo 1 đề custom mới chứa câu hỏi mẫu, kiểm tra xem số lần đã dùng có tăng lên 1 trên DB, nhãn tiêu đề thay đổi và phân quyền lịch sử tài liệu hoạt động đúng hay không.
