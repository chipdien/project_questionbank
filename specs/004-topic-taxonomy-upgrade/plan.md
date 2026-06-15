# Implementation Plan: Nâng Cấp Hệ Thống Phân Loại Chủ Đề Và Gắn Thẻ Câu Hỏi

**Branch**: `feature/004-topic-taxonomy-upgrade` | **Date**: 2026-06-15 | **Spec**: [specs/004-topic-taxonomy-upgrade/spec.md](file:///Volumes/DATA/workspace/vietelite_questionbank/specs/004-topic-taxonomy-upgrade/spec.md)

**Input**: Feature specification from `/specs/004-topic-taxonomy-upgrade/spec.md`

## Summary

Dự án yêu cầu nâng cấp cấu trúc phân mục học tập của ngân hàng câu hỏi VietElite. Chúng ta sẽ chuyển đổi bảng `lms_topics` thành cây phân cấp đệ quy sử dụng kỹ thuật Materialized Path và bổ sung thêm hệ thống gắn thẻ `lms_tags` thông qua Prisma ORM và database MySQL.

## Technical Context

**Language/Version**: Node.js (TypeScript 5.7)

**Primary Dependencies**: Next.js 16.2.4 (React 19), Prisma Client 5.14.0

**Storage**: MySQL 8.0.24, Prisma Client

**Testing**: Ts-node script test

**Target Platform**: Vercel & MySQL Server

**Project Type**: Web Application (Next.js)

**Performance Goals**: Truy vấn lấy toàn bộ con cháu của một node có phản hồi dưới 100ms ở tầng DB và dưới 500ms ở tầng API.

**Constraints**: <200ms p95, MySQL 8.0 tương thích.

**Scale/Scope**: ~34k câu hỏi, ~1.5k topics.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Đã kiểm tra các nguyên lý cốt lõi của dự án và không có vi phạm nào đối với hệ thống hiện tại.

## Project Structure

### Documentation (this feature)

```text
specs/004-topic-taxonomy-upgrade/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── api-schema.json  # API Contract specifications
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma        # Cập nhật schema Prisma

src/
├── app/
│   └── api/
│       ├── topics/      # API xử lý cây chủ đề (đệ quy + materialized path)
│       └── tags/        # API quản lý thẻ tag
└── lib/
    ├── materialized-path.ts # Các helper class/function hỗ trợ sinh path và quản lý cập nhật cây
    └── prisma.ts
```

**Structure Decision**: Web application layout tích hợp trực tiếp vào cấu trúc Next.js App Router có sẵn của VietElite.

## Complexity Tracking

*Không có vi phạm hiến pháp cần theo dõi.*
