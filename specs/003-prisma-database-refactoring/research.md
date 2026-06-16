# Technical Research: Prisma Database Refactoring

**Feature**: [spec.md](./spec.md)

Tài liệu này ghi lại các nghiên cứu kỹ thuật và quyết định kiến trúc cho việc chuyển đổi từ `mysql2` sang Prisma Client 100%.

## 1. Quản lý Prisma Client Singleton trong Next.js

### Quyết định
Tạo một thực thể Prisma Client duy nhất (Singleton) và lưu trữ trên biến `global` trong môi trường phát triển (development) để tránh rò rỉ kết nối khi Next.js hot-reload.

### Lý do chọn
Trong Next.js (ở chế độ phát triển), các module được tải lại liên tục khi mã nguồn thay đổi. Nếu khởi tạo `new PrismaClient()` trực tiếp ở mỗi lần import, mỗi lần reload sẽ mở một kết nối mới tới MySQL, nhanh chóng dẫn đến lỗi `Too many connections`. Việc lưu vào `globalThis` giúp tái sử dụng thực thể client cũ qua các lượt hot-reload.

### Các phương án thay thế
- **Khởi tạo trực tiếp mỗi lần**: Bị loại bỏ vì gây rò rỉ kết nối nghiêm trọng trong môi trường phát triển.
- **Sử dụng Prisma Accelerator/Proxy**: Không cần thiết cho quy mô dự án hiện tại và tăng độ phức tạp hạ tầng.

---

## 2. Giải pháp Serialization kiểu BigInt trong Server Actions

### Quyết định
Xây dựng một hàm helper đệ quy tên là `serializeBigInt` trong `src/lib/utils/serialization.ts`. Hàm này sẽ quét qua toàn bộ cấu trúc dữ liệu trả về từ Prisma và chuyển đổi các trường kiểu `BigInt` thành `string` (hoặc `number` nếu giá trị nằm trong vùng an toàn `Number.MAX_SAFE_INTEGER`). Helper này sẽ được bọc ngoài các kết quả trả về của Server Actions và API Routes trước khi phản hồi về Client.

### Lý do chọn
React Server Actions của Next.js tự động tuần tự hóa dữ liệu trả về. Khi gặp thực thể `BigInt` (ví dụ `10n`), quá trình này sẽ ném ra lỗi `TypeError: Do not know how to serialize a BigInt`. Do đó, dữ liệu bắt buộc phải được định dạng lại thành kiểu JSON-safe (`string`/`number`) trước khi rời khỏi ranh giới Server.

### Các phương án thay thế
- **Ghi đè `BigInt.prototype.toJSON`**: Phương án này chỉ giải quyết được cho `JSON.stringify()`, không giải quyết được cơ chế serialize nội bộ của React Server Actions.
- **Ép kiểu trực tiếp trong từng câu truy vấn Prisma**: Prisma không hỗ trợ chuyển đổi kiểu dữ liệu trả về của `bigint` tự động sang `string` ở mức truy vấn ORM mà không viết các hàm middleware phức tạp. Xử lý sau truy vấn bằng helper đệ quy là sạch sẽ và linh hoạt nhất.

---

## 3. Quản lý Giao dịch (Transaction) trong Ingest Service

### Quyết định
Sử dụng Interactive Transactions của Prisma:
```typescript
await prisma.$transaction(async (tx) => {
  // Thực hiện các truy vấn sử dụng tx
  const doc = await tx.lms_documents.create({...});
  const question = await tx.lms_questions.create({...});
})
```
Điều này đảm bảo toàn vẹn dữ liệu: nếu bất kỳ hành động nào trong giao dịch thất bại, toàn bộ các hành động trước đó trong block giao dịch sẽ được rollback tự động.

### Lý do chọn
Luồng ingest tài liệu và clone tài liệu liên quan đến ghi dữ liệu vào nhiều bảng phụ thuộc (documents, questions, options, questions_documents). Việc dùng Interactive Transaction của Prisma là tương đương trực tiếp và an toàn nhất để thay thế cơ chế `connection.beginTransaction()`, `commit()`, và `rollback()` của `mysql2`.
