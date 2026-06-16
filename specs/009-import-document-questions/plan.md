# Kế hoạch Triển khai: Tái cấu trúc Tab Import Tài liệu (Split-Screen & Phân loại câu hỏi)

**Branch**: `009-import-document-questions` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

---

## 1. Summary

Kế hoạch này nhằm tái cấu trúc lại toàn bộ giao diện và luồng hoạt động của tab **"Import tài liệu"** (đường dẫn `/` - trang chủ hiện tại) thành một quy trình 4 bước hoàn chỉnh. Luồng giao diện mới giúp giáo viên dễ dàng tải lên tài liệu (PDF, Word) hoặc nhiều ảnh đề thi cùng lúc, theo dõi trực quan trạng thái phân tách công thức qua Mathpix và AI, sau đó đối chiếu trực tiếp bản gốc với câu hỏi đã nhận diện thông qua bố cục split-screen 3 cột tiện lợi, hỗ trợ phân loại hàng loạt bằng checkbox và chia sẻ nhanh vào hệ thống ngân hàng câu hỏi dùng chung.

---

## 2. Technical Context

*   **Language/Version**: TypeScript, React 19 (Next.js v16.2.4 App Router)
*   **Libraries/Dependencies**:
    *   **Drag & Drop**: `react-dropzone` (đã có sẵn)
    *   **PDF Rendering**: `react-pdf` hoặc tích hợp `iframe` PDF Viewer của trình duyệt
    *   **Word Rendering**: `mammoth` (đã có sẵn) để parse DOCX sang HTML
    *   **Math Rendering**: `KaTeX` hoặc `MathJax` (đã có sẵn) để render công thức LaTeX
    *   **Lucide Icons**: `Loader2`, `CheckCircle2`, `ChevronLeft`, `ChevronRight`, `Upload`, `Share2`, `Globe`, `Lock`
*   **Database Schema**:
    *   `lms_documents_custom`: Lưu tài liệu đã tạo/import bởi user.
    *   `lms_documents_custom_questions`: Liên kết tài liệu với câu hỏi.
    *   `lms_questions`: Lưu đề bài, hướng dẫn giải.
    *   `lms_options`: Lưu các đáp án trắc nghiệm/lựa chọn.
    *   `lms_topics_questions` & `lms_questions_tags`: Gắn nhãn phân loại học thuật.

---

## 3. Project Structure

Các file mới và chỉnh sửa được cấu trúc gọn gàng dưới thư mục `src/app/(main)/` để đảm bảo tính module hóa:

```text
src/
├── app/
│   └── (main)/
│       ├── page.tsx                             # [MODIFY] Chuyển đổi dữ liệu và nạp luồng ImportWizard
│       └── components/
│           └── import/                          # [NEW] Thư mục chứa toàn bộ components của luồng Import mới
│               ├── ImportWizard.tsx             # [NEW] Quản lý state của cả 4 bước (Wizard Controller)
│               ├── FileUploader.tsx             # [NEW] Step 1: Chọn file, dropzone và uploader button
│               ├── ProcessingOverlay.tsx        # [NEW] Step 2: Overlay loading blur, text progress
│               ├── SplitWorkspace.tsx           # [NEW] Step 3: Workspace 3 cột (Original, Questions, Tagging)
│               ├── OriginalPreview.tsx          # [NEW] Cột 1: Hiển thị PDF/Ảnh/HTML Docx
│               ├── QuestionDataList.tsx         # [NEW] Cột 2: Danh sách câu hỏi, checkbox, double click
│               ├── CollapsibleClassification.tsx# [NEW] Cột 3: Panel phân loại đơn/hàng loạt (Collapsible)
│               └── CompletionModal.tsx          # [NEW] Step 4: Lưu & cấu hình chia sẻ (Public/Private)
```

---

## 4. Proposed Changes

### 4.1. Cấu hình Entrypoint (Page.tsx)

#### [MODIFY] [page.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/page.tsx)
*   Thay thế việc render trực tiếp `QuestionsManager` bằng component mới `ImportWizard`.
*   Truyền các dữ liệu danh mục được fetch từ server làm props cho `ImportWizard`:
    *   Cây chủ đề học thuật đệ quy (`getTopics()`)
    *   Danh sách thẻ tags (`getTagsByCategory()`)
    *   Danh sách độ khó (`getDifficulties()`)
    *   Danh sách lớp học (Grades)
    *   Danh sách các tài liệu đã tải gần đây (để hiển thị lịch sử ở Step 1)

---

### 4.2. Xây dựng luồng Import (Wizard Components)

#### [NEW] [ImportWizard.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/components/import/ImportWizard.tsx)
*   Quản lý State chính của quy trình:
    *   `currentStep`: `1` (Upload), `2` (Processing), `3` (Workspace), `4` (Completion Modal).
    *   `files`: Danh sách tập tin đã chọn (mảng các File).
    *   `processedQuestions`: Mảng câu hỏi sau khi được API của Mathpix & Gemini xử lý thành công.
    *   `selectedQuestionIds`: Set chứa ID của các câu hỏi đang được tích checkbox để phân loại hàng loạt.
    *   `activeQuestionId`: ID của câu hỏi đang được chọn để gán nhãn đơn lẻ hoặc chỉnh sửa.
*   Điều phối hành động chuyển bước (nhấn Submit chuyển từ Step 1 sang Step 2, API trả kết quả chuyển sang Step 3, lưu chuyển sang Step 4).

#### [NEW] [FileUploader.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/components/import/FileUploader.tsx)
*   **Step 1 Interface**:
    *   Thanh Toolbar chứa nút **"Tải lên tệp"** nhỏ gọn (`height: 36px`) kèm icon.
    *   Khu vực chính hiển thị một **Dropzone** lớn cho phép kéo thả.
    *   **Validation**:
        *   Nếu chọn nhiều ảnh: Hiển thị mảng ảnh preview dạng grid nhỏ bên dưới kèm nút xóa từng ảnh.
        *   Nếu chọn file PDF/Word: Chỉ hiển thị 1 file duy nhất. Ẩn nút chọn thêm tệp nếu đã có file tài liệu.
    *   Phần chân trang hiển thị **"Tệp đã tải gần đây"** giúp người dùng click chọn lại nhanh các đề cũ để đối chiếu phân loại tiếp nếu chưa làm xong.

#### [NEW] [ProcessingOverlay.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/components/import/ProcessingOverlay.tsx)
*   **Step 2 Interface**:
    *   Overlay với CSS classes: `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-[4px] pointer-events-none`.
    *   Dùng Lucide `Loader2` với animation quay tròn làm spinner chính.
    *   Lắng nghe SSE (Server-Sent Events) hoặc giả lập các bước thời gian thực để cập nhật văn bản trạng thái từng dòng:
        1. *Đang đẩy tập tin lên máy chủ S3...*
        2. *Đang nhận dạng công thức Mathpix OCR...*
        3. *AI đang cấu trúc câu hỏi & phân giải đáp án...*
        4. *Đang chuẩn bị không gian làm việc...*

#### [NEW] [SplitWorkspace.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/components/import/SplitWorkspace.tsx)
*   **Step 3 Layout**:
    *   Grid 3 cột với tỉ lệ độ rộng: `45% - 40% - 15%` sử dụng Tailwind CSS `grid-cols-[45fr_40fr_15fr]`.
    *   Quản lý việc thu gọn (collapse) cột 3: Khi cột 3 thu gọn, CSS chuyển thành `grid-cols-[45fr_55fr_0fr]`.

#### [NEW] [OriginalPreview.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/components/import/OriginalPreview.tsx)
*   **Cột 1 (Bên trái)**:
    *   Nhận prop `file` hoặc `s3Url`.
    *   Nếu là PDF: Render bằng `iframe` trỏ đến PDF URL hoặc nhúng PDF viewer mặc định của trình duyệt để hỗ trợ cuộn trang, zoom.
    *   Nếu là Ảnh: Hiển thị danh sách ảnh cuộn dọc kèm nút zoom to khi click.
    *   Nếu là Word: Gọi API parse word thô (trả về HTML) để render an toàn qua `dangerouslySetInnerHTML`.

#### [NEW] [QuestionDataList.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/components/import/QuestionDataList.tsx)
*   **Cột 2 (Ở giữa)**:
    *   Hiển thị danh sách các card câu hỏi Mathpix.
    *   Đầu mỗi card có Checkbox. Tích chọn checkbox sẽ thêm ID câu hỏi vào `selectedQuestionIds`.
    *   Card câu hỏi render công thức LaTeX bằng KaTeX để đảm bảo hiển thị đúng toán học học thuật.
    *   Hiển thị các badge chủ đề và tag hiện tại ở đáy card.
    *   Sự kiện `onDoubleClick` vào card mở `QuestionEditModal` để thay đổi text trực tiếp.

#### [NEW] [CollapsibleClassification.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/components/import/CollapsibleClassification.tsx)
*   **Cột 3 (Bên phải)**:
    *   Thiết kế dạng hộp nổi (sticky drawer) hoặc panel cố định có nút Toggle ở mép.
    *   Khi `selectedQuestionIds.size === 0` và chọn `activeQuestionId`:
        *   Hiển thị cây chủ đề và tags của câu hỏi hiện tại.
        *   User chỉnh sửa -> Cập nhật trực tiếp cho câu hỏi đó.
    *   Khi `selectedQuestionIds.size > 0` (Bulk Mode):
        *   Hiển thị tiêu đề màu cảnh báo: `"Phân loại hàng loạt (X câu đang chọn)"`.
        *   Cho phép chọn chủ đề từ cây đệ quy và thêm/xóa tag đồng loạt.
        *   Nút **"Áp dụng đồng loạt"** thực hiện cập nhật toàn bộ mảng ID đang chọn qua Server Action.

#### [NEW] [CompletionModal.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/components/import/CompletionModal.tsx)
*   **Step 4 Interface**:
    *   Hiển thị modal hỏi người dùng thông tin hoàn thành:
        *   Input chỉnh sửa tên tài liệu cuối cùng (mặc định lấy tên file gốc).
        *   Tùy chọn Radio: **Riêng tư (Private)** hoặc **Công khai (Public)**.
        *   Trường liên kết tĩnh (Public Link) tự động sinh ra kèm nút sao chép (Chỉ hiện khi chọn Public).
        *   Nút **"Xác nhận & Lưu vào Kho"** để lưu tài liệu cùng các câu hỏi đã gán nhãn vào hệ thống chính.

---

## 5. Verification Plan

### 5.1. Automated Tests
*   Viết test case kiểm tra component `FileUploader`:
    *   Đảm bảo chọn > 1 file PDF/DOCX kích hoạt báo lỗi.
    *   Đảm bảo chọn nhiều ảnh được hiển thị preview đầy đủ.
*   Viết unit test cho tính năng phân loại đồng loạt (Bulk Update Action):
    *   Mảng ID truyền vào CSDL được gán chính xác quan hệ `lms_topics_questions` và `lms_questions_tags` mà không ghi đè lẫn nhau hoặc gây ra deadlock.

### 5.2. Manual Verification
*   **Test luồng upload**: Tải 1 file PDF lên -> Chờ loading blur -> Hiển thị Split view -> Kiểm tra PDF xem được ở cột trái, câu hỏi khớp ở cột giữa.
*   **Test luồng phân loại hàng loạt**: Chọn checkbox ở 3 câu hỏi -> Chọn Topic học thuật ở panel phải -> Nhấn áp dụng -> Kiểm tra trong DB hoặc giao diện xem cả 3 câu hỏi đều đã được gắn đúng Topic đó.
*   **Test sửa đổi**: Click đúp vào 1 câu hỏi -> Sửa đề bài -> Lưu -> Xem công thức LaTeX mới có render đúng không.
*   **Test public/private**: Lưu tài liệu dưới dạng Public -> Copy link -> Mở ở trình duyệt ẩn danh (không đăng nhập hoặc tài khoản khác) -> Xác thực tài liệu vẫn hiển thị bình thường.
