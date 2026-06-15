# Kế hoạch Triển khai: Hoàn thiện Bộ Tiêu chí Phân loại và Bộ lọc Ngân hàng Câu hỏi

**Branch**: `006-question-classification-filtering` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Đặc tả tính năng từ `/specs/006-question-classification-filtering/spec.md`

## Summary

Dự án cần nâng cấp hệ thống phân loại câu hỏi (Questions Classification) và bộ lọc tìm kiếm trong Ngân hàng câu hỏi (Question Bank) theo các tiêu chí: Khối lớp (Grade), Độ khó (Difficulty), Chủ đề đệ quy (Topics) và Thẻ phân loại (Tags theo danh mục SOURCE, METHOD, SKILL). 

### Giải pháp kỹ thuật:
1. **API/Server Action**: Nâng cấp hàm `getLibraryQuestions` trong `src/actions/question.ts` để nhận thêm các tham số lọc: `grades[]`, `difficulties[]`, `topicIds[]`, `tagIds[]`, `keyword`. Truy vấn đệ quy theo chủ đề sẽ sử dụng cột `path` của `lms_topics` để tìm tất cả chủ đề con cháu thuộc chủ đề được chọn.
2. **Giao diện bộ lọc (Filter Panel)**: Thay thế giao diện bộ lọc hiện tại bằng một bảng điều khiển bộ lọc mới, hỗ trợ chọn nhiều (multi-select) cho Khối lớp và Độ khó; hiển thị Dropdown hoặc cây chủ đề học thuật thu gọn được; và các thẻ tag được gom nhóm theo category (Nguồn gốc - SOURCE, Phương pháp - METHOD, Kỹ năng - SKILL).
3. **Đồng bộ hóa URL**: Đồng bộ hóa trạng thái bộ lọc lên URL query parameters bằng hook của Next.js để giữ trạng thái bộ lọc khi reload hoặc chia sẻ link.

## Technical Context

**Language/Version**: TypeScript, Node.js v20+, React 19 (Next.js v16.2.4)

**Primary Dependencies**: Next.js App Router, Prisma ORM, Tailwind CSS, Lucide React

**Storage**: MySQL Database (Prisma Client)

**Testing**: Kiểm thử thủ công trên giao diện & kiểm thử qua API/Server Action.

**Target Platform**: Web Browsers (Chrome, Safari, Firefox)

**Project Type**: Web Application (Next.js)

**Performance Goals**: API lọc câu hỏi phản hồi < 300ms với 10.000+ câu hỏi. Giao diện bộ lọc phản hồi mượt mà không lag (< 16ms/frame).

**Constraints**: Đảm bảo an toàn dữ liệu, tính toàn vẹn quan hệ (relation integrity) qua Prisma.

**Scale/Scope**: Áp dụng trong toàn bộ trang Ngân hàng câu hỏi (`/question-bank`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Không vi phạm quy tắc cốt lõi nào của dự án.
- Tuân thủ cấu trúc Single Project.
- Các API/Server Action được thiết kế chuẩn hóa và an toàn.

## Project Structure

### Documentation (this feature)

```text
specs/006-question-classification-filtering/
├── plan.md              # File kế hoạch này
├── research.md          # Kết quả nghiên cứu Phase 0
├── data-model.md        # Thiết kế dữ liệu Phase 1
├── quickstart.md        # Hướng dẫn xác thực/chạy thử Phase 1
└── checklists/
    └── requirements.md  # Checklist chất lượng đặc tả
```

### Source Code (repository root)

```text
src/
├── actions/
│   └── question.ts      # [MODIFY] Nâng cấp getLibraryQuestions hỗ trợ lọc đa chiều
├── app/
│   └── (main)/
│       └── question-bank/
│           ├── components/
│           │   ├── QuestionBankManager.tsx  # [MODIFY] Tích hợp bộ lọc mới, đồng bộ URL
│           │   └── QuestionFilterPanel.tsx  # [NEW] Giao diện bảng điều khiển bộ lọc nâng cao
│           └── hooks/
│               └── useQuestionBank.ts       # [MODIFY] Quản lý state bộ lọc nâng cao và sync với URL
```

**Structure Decision**: Tuân thủ cấu trúc Single Project của dự án Next.js hiện tại, sửa đổi/thêm mới các file thuộc component Ngân hàng câu hỏi.

## Complexity Tracking

*Không có vi phạm hiến pháp nào.*
