# Kế hoạch Triển khai: Tạo Câu hỏi Thủ công (Manual Question Creator)

**Branch**: `008-create-manual-questions` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

---

## Summary

Bổ sung tính năng tạo câu hỏi thủ công trực tiếp từ giao diện admin/giáo viên. Tính năng này được tích hợp vào Sidebar (dưới mục "Xử lý tài liệu" được tái cấu trúc thành menu con), hỗ trợ 4 loại hình câu hỏi chính (Trắc nghiệm, Đúng/Sai, Điền khuyết, Tự luận) với giao diện phân tách 2 cột thông minh (Cột trái soạn thảo, cột phải phân loại học thuật và gắn tag) để tối ưu trải nghiệm người dùng không bị rối mắt. Toàn bộ logic lưu trữ CSDL được đưa vào một file service riêng biệt là `question-manual.service.ts` để giữ mã nguồn gọn gàng.

---

## Technical Context

- **Language/Version**: TypeScript, React 19 (Next.js v16.2.4 App Router)
- **Primary Dependencies**: Prisma ORM, Tailwind CSS, Lucide React, Vditor Editor (có sẵn)
- **Storage**: MySQL Database (Prisma Client)
- **Target Platform**: Web Browsers

---

## Project Structure

```text
src/
├── actions/
│   └── question-manual.ts               # [NEW] Server action wrapper cho manual question creator
├── lib/
│   └── services/
│       └── question-manual.service.ts   # [NEW] Dịch vụ xử lý DB cho việc lưu câu hỏi thủ công
├── components/
│   └── layout/
│       └── Sidebar.tsx                  # [MODIFY] Cập nhật danh sách menu con cho "Xử lý tài liệu"
└── app/
    └── (main)/
        └── manual-create/
            ├── page.tsx                 # [NEW] Trang chủ tạo câu hỏi thủ công (SSR fetching data)
            └── components/
                ├── QuestionCreator.tsx  # [NEW] Component chính quản lý state biên soạn câu hỏi
                ├── AnswerForm.tsx       # [NEW] Form đáp án động thay đổi theo loại câu hỏi
                └── ClassificationSidebar.tsx # [NEW] Sidebar bên phải chọn lớp, khó, chủ đề & tags
```

---

## Proposed Changes

### 1. Tách biệt dịch vụ Backend & Action

#### [NEW] [question-manual.service.ts](file:///d:/VietElite/project_questionbank/src/lib/services/question-manual.service.ts)
- Xây dựng lớp `QuestionManualService` chứa phương thức static `createQuestion`:
  - Nhận tham số: `statement`, `content`, `question_type`, `question_difficulty`, `grade`, `hint`, `options` (danh sách options), `topicIds` (mảng chủ đề), `tagIds` (mảng tags).
  - Sử dụng giao dịch `prisma.$transaction` để:
    1. Tạo bản ghi `lms_questions`.
    2. Tạo các bản ghi liên quan trong `lms_options` (với `weight` và `order`).
    3. Tạo liên kết trong `lms_topics_questions`.
    4. Tạo liên kết trong `lms_questions_tags`.
  - Trả về đối tượng câu hỏi đã tạo cùng trạng thái thành công.

#### [NEW] [question-manual.ts](file:///d:/VietElite/project_questionbank/src/actions/question-manual.ts)
- Khai báo `'use server'`.
- Định nghĩa Server Action `createManualQuestionAction` gọi trực tiếp đến `QuestionManualService.createQuestion` sau khi xác thực người dùng hiện tại thông qua `getCurrentUser()`.

---

### 2. Tái cấu trúc Sidebar & Menu Navigation

#### [MODIFY] [Sidebar.tsx](file:///d:/VietElite/project_questionbank/src/components/layout/Sidebar.tsx)
- Cập nhật danh sách `navItems` để tích hợp cấu trúc phân cấp:
  - Mục `Xử lý tài liệu` sẽ không dẫn thẳng tới `/` mà có các tùy chọn mở rộng.
  - Hỗ trợ hiển thị menu con thụt lề khi ở chế độ mở rộng (`!isCollapsed`):
    - **Tạo thủ công** -> dẫn đến `/manual-create`.
    - **Import tài liệu** -> dẫn đến `/`.

---

### 3. Giao diện Biên soạn & Phân loại học thuật (Frontend)

#### [NEW] [page.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/manual-create/page.tsx)
- Nạp trước các dữ liệu danh mục cần thiết từ Server:
  - Khối lớp (Grade list).
  - Độ khó (Difficulties list lấy từ `getDifficulties()`).
  - Danh sách chủ đề đệ quy (Topics list lấy từ `getTopics()`).
  - Danh sách tags theo nhóm (Tags list lấy từ `getTagsByCategory()`).
- Render component client `QuestionCreator` và truyền dữ liệu danh mục làm props.

#### [NEW] [QuestionCreator.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/manual-create/components/QuestionCreator.tsx)
- Quản lý state của câu hỏi biên soạn:
  - `question_type` (Mặc định: `SINGLE_CHOICE`).
  - `statement` (Đề bài).
  - `options` (Mảng đáp án).
  - `hint` (Lời giải/tự luận).
  - `grade`, `question_difficulty`, `topicIds`, `tagIds` (Phân loại).
- Giao diện chia 2 cột sử dụng Tailwind CSS flex/grid layout:
  - **Cột Trái (70%)**: Selector chọn loại câu hỏi, VditorEditor đề bài, và component `<AnswerForm />`.
  - **Cột Phải (30% - Sticky)**: Component `<ClassificationSidebar />` để chọn các thông tin phân loại.
- Các nút hành động chính ở chân trang: "Hủy", "Lưu & Tạo tiếp", "Lưu & Quay về".

#### [NEW] [SaveCollectionModal.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/manual-create/components/SaveCollectionModal.tsx)
- Modal xác nhận trước khi lưu: cho phép người dùng chọn bộ sưu tập hiện có hoặc nhập tên bộ sưu tập mới để lưu trực tiếp câu hỏi vừa tạo vào đó.

#### [NEW] [AnswerForm.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/manual-create/components/AnswerForm.tsx)
- Hiển thị giao diện nhập đáp án tương ứng với `question_type`:
  - `SINGLE_CHOICE` / `MULTIPLE_CHOICE`: 4 ô nhập text/Vditor, nút chọn đáp án đúng.
  - `TRUE_FALSE`: 4 ô nhập phát biểu, kèm cụm chọn Đúng/Sai cho từng ý.
  - `FILL_IN`: Ô nhập đáp án cho các ô trống được phát hiện trong đề bài.
  - `ESSAY`: Khung soạn thảo lời giải chi tiết duy nhất.

#### [NEW] [ClassificationSidebar.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/manual-create/components/ClassificationSidebar.tsx)
- Hiển thị cây chủ đề học thuật đệ quy:
  - Render cấu trúc hình cây (cho phép click để đóng/mở các node cha).
  - Tích chọn chủ đề bằng checkbox.
- Hiển thị các nhóm Tag:
  - Gom nhóm tag theo `category`.
  - Hiển thị tag dưới dạng các badge/chip để click chọn nhanh (toggle state).

---

## Verification Plan

### Automated/Manual Tests
- Tạo mới các loại câu hỏi khác nhau từ giao diện `/manual-create` và xác thực:
  - Đúng loại câu hỏi và số lượng đáp án mong muốn được lưu vào DB.
  - Các mối quan hệ topics và tags trong DB được tạo chính xác.
  - Chuyển đổi qua lại giữa các loại hình câu hỏi diễn ra mượt mà không mất đi đề bài đã soạn thảo.
  - Kiểm tra Sidebar hiển thị đúng cấu trúc và chuyển trang chính xác.
