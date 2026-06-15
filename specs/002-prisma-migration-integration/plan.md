# Implementation Plan: Tích hợp Prisma ORM và Hệ thống Migration

**Branch**: `feature/002-prisma-migration-integration` | **Date**: 2026-06-15 | **Spec**: [specs/002-prisma-migration-integration/spec.md](spec.md)

**Input**: Feature specification from `/specs/002-prisma-migration-integration/spec.md`

## Summary

Dự án sẽ tích hợp thư viện **Prisma ORM** và thiết lập **Prisma Migrate** để tự động hóa công tác quản trị và thay đổi cấu trúc dữ liệu. Để đảm bảo an toàn tuyệt đối, hệ thống sẽ duy trì song song helper `mysql2/promise` cũ cho các chức năng cũ và áp dụng Prisma Client Singleton cho các chức năng mới.

## Technical Context

**Language/Version**: TypeScript / Node.js (phiên bản Next.js 16.2.4)

**Primary Dependencies**: `prisma` (v5+ CLI/Dev), `@prisma/client` (v5+ Client runtime), `mysql2` (duy trì phiên bản cũ)

**Storage**: MySQL (phiên bản 8.0.24)

**Testing**: Chạy lệnh test CLI và kiểm thử script bằng `npx tsx`

**Target Platform**: VPS Linux chạy aaPanel (môi trường production)

**Project Type**: Next.js Web Application

**Performance Goals**: Truy vấn thông qua Prisma client có thời gian thực thi dưới 50ms cho các truy vấn đơn giản.

**Constraints**:
* Không được sửa đổi/xóa dữ liệu cũ trên database của khách hàng trên production.
* Duy trì helper `query()` cũ không lỗi.

**Scale/Scope**: Ánh xạ đầy đủ 22 bảng hiện có trong file SQL dump.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

* **Quy tắc TDD:** Đảm bảo viết các đoạn script test trước để kiểm tra kết nối và cấu trúc dữ liệu.
* **Quy tắc Simplicity:** Tối giản hóa cấu trúc kết nối, không thêm các gói phụ trợ không cần thiết ngoài Prisma core.

## Project Structure

### Documentation (this feature)

```text
specs/002-prisma-migration-integration/
├── plan.md              # File này
├── research.md          # Kết quả nghiên cứu Singleton & Baselining
├── data-model.md        # Ánh xạ Prisma Model của các bảng
└── quickstart.md        # Hướng dẫn chạy test & lệnh migration
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma         # Cấu hình nguồn dữ liệu & Models của Prisma
└── migrations/           # Nhật ký lịch sử migrations

src/
├── lib/
│   └── db/
│       ├── index.ts      # Khách hàng mysql2 cũ (Backward Compatibility)
│       └── prisma.ts     # Singleton Prisma Client mới
```

**Structure Decision**: Chọn cấu trúc tích hợp trực tiếp thư mục `prisma/` tại thư mục gốc và bổ sung file singleton `prisma.ts` vào module `src/lib/db/` dùng chung cho toàn bộ ứng dụng Next.js.
