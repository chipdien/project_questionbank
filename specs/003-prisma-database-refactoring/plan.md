# Implementation Plan: Tái cấu trúc kết nối cơ sở dữ liệu với Prisma

**Branch**: `003-prisma-database-refactoring` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-prisma-database-refactoring/spec.md`

## Summary

Thay thế hoàn toàn thư viện kết nối cơ sở dữ liệu `mysql2/promise` trực tiếp bằng Prisma Client cho toàn bộ ứng dụng. 100% các câu truy vấn SQL thô sẽ được viết lại dưới dạng cú pháp Prisma ORM Fluent API để tăng tính an toàn dữ liệu, tự động hóa ánh xạ quan hệ, và chuẩn hóa cấu trúc truy vấn CSDL. Giải quyết vấn đề serialization kiểu `BigInt` trong Server Actions và quản lý singleton cho Prisma Client trong Next.js.

## Technical Context

- **Language/Version**: TypeScript / Node.js 18+ (Next.js 16.2.4)
- **Primary Dependencies**: `@prisma/client` ^5.14.0, `prisma` ^5.14.0 (dev-dependency)
- **Storage**: MySQL 8.0
- **Testing**: N/A (Không cấu hình framework test tự động, kiểm thử thủ công và kiểm thử API)
- **Target Platform**: Node.js Serverless runtime (Next.js App Router)
- **Project Type**: Web application
- **Performance Goals**: Phản hồi API và Server Actions tương đương hoặc tối ưu hơn truy vấn raw SQL (< 200ms cho các truy vấn đơn giản).
- **Constraints**: 
  - Khắc phục lỗi serialization kiểu dữ liệu `BigInt` của Prisma trong Next.js Server Actions.
  - Quản lý kết nối Prisma Client duy nhất (Singleton) tránh lỗi cạn kiệt pool trong phát triển/hot-reload.
- **Scale/Scope**: Refactor toàn bộ các tệp sử dụng `mysql2` nằm trong `src/actions/`, `src/lib/services/`, `src/app/api/`, và các file Next.js Page trực tiếp truy vấn DB.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Quy tắc 1: Tách biệt logic và giao diện**: Đảm bảo các logic truy vấn qua Prisma nằm trong các file Actions (`src/actions/`) hoặc Services (`src/lib/services/`), không nhúng logic truy vấn trực tiếp trong UI trừ phi cần thiết.
- **Quy tắc 2: An toàn dữ liệu & Rollback**: Tất cả các hành động ghi đồng thời (Ingest/Clone) bắt buộc phải bọc trong `$transaction` để đảm bảo không lỗi dữ liệu mồ côi.

## Project Structure

### Documentation (this feature)

```text
specs/003-prisma-database-refactoring/
├── spec.md              # Tài liệu đặc tả yêu cầu
├── plan.md              # File này (kế hoạch thực hiện)
├── research.md          # Kết quả nghiên cứu (Phase 0)
├── data-model.md        # Thiết kế thực thể Prisma (Phase 1)
└── quickstart.md        # Hướng dẫn chạy và xác thực (Phase 1)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma        # Prisma Schema hiện tại

src/
├── actions/             # Server Actions (difficulty.ts, question.ts, auth.ts, etc.)
├── app/
│   ├── (main)/
│   └── api/             # API Routes (upload-and-save, list, etc.)
├── lib/
│   ├── db/
│   │   ├── index.ts     # Nơi quản lý Prisma Client singleton và helpers
│   └── services/        # Services xử lý nghiệp vụ (ingest.ts, ai.ts)
└── utils/
    └── serialization.ts # Helpers xử lý kiểu BigInt
```

**Structure Decision**: Refactor trực tiếp trên cấu trúc thư mục hiện tại của dự án Next.js, thay đổi trung tâm kết nối tại `src/lib/db/index.ts` và cập nhật các tệp tin liên quan.

## Complexity Tracking

*Không có vi phạm hiến pháp đặc thù cần theo dõi.*
