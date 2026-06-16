# Implementation Plan: Quản lý Giáo trình (Syllabus/Topics) và Thẻ (Tags)

**Branch**: `005-syllabus-tag-management` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-syllabus-tag-management/spec.md`

## Summary

Xây dựng giao diện quản lý trực quan cho giáo trình (cây chủ đề `lms_topics`) và bộ thẻ tag (`lms_tags`). Triển khai cơ chế xóa an toàn (Option A) bằng cách chặn xóa chủ đề nếu có liên kết câu hỏi/chủ đề con, cung cấp giao diện hiển thị câu hỏi liên quan và tính năng chuyển đổi hàng loạt sang chủ đề khác trước khi tiến hành xóa.

## Technical Context

**Language/Version**: TypeScript / Node.js (Next.js 16)

**Primary Dependencies**: Prisma Client, Tailwind CSS v4, Lucide React, react-sortablejs, Framer Motion

**Storage**: MySQL (Prisma ORM)

**Testing**: Kịch bản chạy bằng `tsx` trong thư mục `tests/`

**Target Platform**: Web Browser (Chrome, Safari, Firefox), Node.js server environment

**Project Type**: Next.js Web Application (App Router)

**Performance Goals**:
- Truy xuất và dựng cây chủ đề < 300ms.
- API cập nhật di chuyển nhánh cây chủ đề < 300ms.
- Tìm kiếm, lọc thẻ tag < 200ms.

**Constraints**:
- Chặn hành động xóa chủ đề có liên kết (lớp API & Database integrity).
- Đảm bảo Materialized Path (`path`) cập nhật đệ quy chính xác cho toàn bộ nhánh con.
- Đảm bảo tính duy nhất của tên tag (case-insensitive) và code chủ đề.

**Scale/Scope**: ~1,500+ topics, ~10,000+ questions, ~500+ tags.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Không tự ý import thư viện Tree phức tạp không cần thiết (sử dụng react-sortablejs có sẵn).
- [x] Đảm bảo cấu trúc code và API tuân thủ đúng chuẩn RESTful.
- [x] Tận dụng tối đa module `materialized-path.ts` có sẵn trong dự án.

## Project Structure

### Documentation (this feature)

```text
specs/005-syllabus-tag-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    ├── api-topics.md
    ├── api-tags.md
    └── api-topics-transfer.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (main)/
│   │   ├── topics/
│   │   │   └── page.tsx              # Giao diện Quản lý cây chủ đề
│   │   └── tags/
│   │       └── page.tsx              # Giao diện Quản lý thẻ tag
│   └── api/
│       └── topics/
│           └── [id]/
│               ├── route.ts          # Cập nhật API DELETE (chặn xóa)
│               ├── related/
│               │   └── route.ts      # [NEW] API truy vấn thực thể liên quan
│               └── transfer/
│                   └── route.ts      # [NEW] API chuyển đổi câu hỏi hàng loạt
├── components/
│   └── layout/
│       └── Sidebar.tsx               # Cập nhật menu để thêm liên kết quản lý
```

**Structure Decision**: Tính năng này được tích hợp trực tiếp vào cấu trúc Next.js App Router đơn dự án hiện tại dưới nhóm route `(main)` và API route tương ứng.

## Complexity Tracking

*Không có vi phạm hiến pháp nào cần giải trình.*
