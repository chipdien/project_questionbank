# Danh sách nhiệm vụ: Tái cấu trúc Tab Import Tài liệu (Split-Screen & Phân loại câu hỏi)

Danh sách nhiệm vụ được sắp xếp theo trình tự triển khai từ nền tảng, giao diện con, tích hợp và kiểm thử.

---

## Nhóm 1: Thiết lập cấu trúc & Wizard Controller (Step 0)
- [x] Khởi tạo thư mục chứa components mới: `src/app/(main)/components/import/`
- [x] Tạo file chính `ImportWizard.tsx` để điều phối State toàn cục (bước 1 → 4, mảng files, câu hỏi sau xử lý, câu hỏi đang chọn, v.v.)
- [x] Định nghĩa các Interfaces cho dữ liệu Question, Topic, Tag, Document để đảm bảo Type-Safety.

---

## Nhóm 2: Xây dựng Giao diện Tải lên & Xử lý (Step 1 & 2)
- [x] Phát triển `FileUploader.tsx` (Step 1):
    - [x] Giao diện Dropzone kéo thả hỗ trợ validation (max 1 PDF/DOCX hoặc nhiều Ảnh).
    - [x] Nút Upload nhỏ gọn trên thanh toolbar công cụ.
    - [x] Grid hiển thị các file đã chọn kèm nút Xóa (Remove).
    - [x] Tích hợp phần hiển thị danh sách các tài liệu cũ đã xử lý gần đây ở chân trang.
- [x] Phát triển `ProcessingOverlay.tsx` (Step 2):
    - [x] Thiết kế overlay toàn màn hình, blur nền sau (`backdrop-blur`) và khóa tương tác chuột (`pointer-events-none`).
    - [x] Thêm Spinner quay tròn mượt mà bằng CSS/Lucide.
    - [x] Tích hợp cập nhật văn bản trạng thái động theo thời gian thực tương ứng tiến trình chạy của API.

---

## Nhóm 3: Workspace Split-Screen 3 Cột (Step 3)
- [x] Phát triển `SplitWorkspace.tsx`:
    - [x] Thiết lập Grid 3 cột theo tỉ lệ `45% - 40% - 15%`.
    - [x] Tích hợp cơ chế thu gọn/mở rộng cột 3 (Classification Panel) bằng nút Toggle ở mép.
- [x] Phát triển `OriginalPreview.tsx` (Cột 1):
    - [x] Nhúng PDF Viewer bằng `iframe` (blob URL cho local, S3 URL cho remote).
    - [x] Nhúng danh sách Ảnh cuộn dọc có thanh scroll riêng biệt.
    - [x] Parse nội dung Word (DOCX) qua API `/api/docx-preview` → HTML an toàn (mammoth server-side).
- [x] Phát triển `QuestionDataList.tsx` (Cột 2):
    - [x] Render danh sách câu hỏi có Checkbox gán ở đầu card.
    - [x] Render LaTeX KaTeX cho công thức toán học.
    - [x] Bắt sự kiện double-click để hiển thị `QuestionEditModal` chỉnh sửa trực tiếp nội dung câu hỏi/đáp án.
- [x] Phát triển `CollapsibleClassification.tsx` (Cột 3):
    - [x] Thiết kế cây chủ đề đệ quy cho phép click chọn mục lục.
    - [x] Hiển thị danh sách tags theo chuyên mục để chọn lựa nhanh.
    - [x] Tự động chuyển đổi chế độ gán nhãn: **Single Mode** (khi chọn 1 câu) và **Bulk Mode** (khi chọn nhiều checkbox).
    - [x] Tích hợp nút "Áp dụng đồng loạt" để gọi Server Action cập nhật nhiều câu hỏi cùng lúc.

---

## Nhóm 4: Modal Hoàn tất & Chia sẻ (Step 4)
- [x] Phát triển `CompletionModal.tsx` (Step 4):
    - [x] Nhập/Chỉnh sửa tên đề thi/tài liệu trước khi hoàn tất.
    - [x] Tùy chọn trạng thái bảo mật: Public (Công khai) / Private (Riêng tư).
    - [x] Hiển thị liên kết tĩnh (Public Link) kèm nút sao chép nhanh nếu tài liệu ở chế độ Công khai.
    - [x] Nút "Xác nhận & Lưu vào Kho" để kích hoạt hành động ghi nhận cuối cùng vào CSDL.

---

## Nhóm 5: Tích hợp API & Server Actions
- [x] Viết Server Action `classifyQuestions` hỗ trợ gán topic và tags hàng loạt cho danh sách ID câu hỏi (đã có trong `question.ts`).
- [x] Tạo Server Actions mới trong `document-library.ts`: `getRecentDocuments`, `updateDocumentVisibility`.
- [x] Tạo API route `/api/docx-preview` để server-side convert DOCX → HTML.
- [x] Tạo trang riêng `/import` (Server Component) thay vì nhúng vào `page.tsx`.
- [x] Cập nhật Sidebar: điều hướng "Import tài liệu" → `/import`, auto-expand khi active.
- [x] Đảm bảo cleanup blob URLs bằng `useEffect` return function trong `OriginalPreview.tsx`.

---

## Nhóm 6: Kiểm thử & Đánh giá (QA)
- [x] `npx tsc --noEmit` → **0 TypeScript errors**
- [x] `GET /import` → **HTTP 200** (server render thành công)
- [x] Dev server khởi động bình thường — Next.js 16.2.4 Turbopack
- [ ] Kiểm tra khả năng tương thích của PDF Viewer trên Chrome, Edge, Safari.
- [ ] Xác nhận overlay của Step 2 chặn click 100%, không bị vỡ giao diện khi chuyển đổi nhanh.
- [ ] Kiểm thử việc gán nhãn đồng loạt cho 10+ câu hỏi cùng lúc để đo thời gian phản hồi.
- [ ] Kiểm thử bảo mật: Xác thực giáo viên khác không truy cập được link chia sẻ nếu tài liệu ở trạng thái Private.
