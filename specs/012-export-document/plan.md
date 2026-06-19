# Thống kê Số lần Sử dụng Câu hỏi trong Đề xuất Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm trường `export_count` vào model `lms_questions`, tự động tăng số lần dùng khi xuất đề thành công, hiển thị badge "đã dùng X" trên các màn hình liên quan của giáo viên và admin.

**Architecture:** Cập nhật Prisma Schema (`lms_questions`), tạo database migration, viết script một lần để cập nhật các số liệu cũ. Cập nhật transaction trong API `upload-and-save` để tăng `export_count` đồng loạt qua Raw SQL. Cập nhật components ở frontend hiển thị nhãn "đã dùng X" / "Lượt dùng".

**Tech Stack:** Next.js (App Router), Prisma Client (MySQL), React (TypeScript), Tailwind CSS.

---

## File Changes Map
- **Prisma Schema**:
  - Modify: [schema.prisma](file:///d:/VietElite/project_questionbank/prisma/schema.prisma) (thêm `export_count` vào `lms_questions`)
- **Script**:
  - Create: `scripts/populate-export-count.ts` (script một lần đếm đề custom và điền số liệu cũ)
- **API Backend**:
  - Modify: [route.ts](file:///d:/VietElite/project_questionbank/src/app/api/documentcustom/upload-and-save/route.ts) (tăng `export_count` khi xuất đề thành công)
- **Frontend Components**:
  - Modify: [QuestionListTable.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-list/components/QuestionListTable.tsx) (thêm cột "Lượt dùng")
  - Modify: [QuestionDetailModal.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-list/components/QuestionDetailModal.tsx) (thêm badge "Đã dùng: X lần")
  - Modify: [QuestionLibrary.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/components/QuestionLibrary.tsx) (thêm badge "đã dùng X" cho từng câu)
- Modify: [DocumentBuilder.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/components/DocumentBuilder.tsx) (thêm cấu hình loại tài liệu docType)
- Modify: [useDocumentBuilder.ts](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/hooks/useDocumentBuilder.ts) (thêm docType vào Metadata state)
- Modify: [list/route.ts](file:///d:/VietElite/project_questionbank/src/app/api/documentcustom/list/route.ts) (lọc danh sách tài liệu theo user và lấy tên người tạo cho admin)
- Modify: [useSavedDocumentsLibrary.ts](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/hooks/useSavedDocumentsLibrary.ts) (lấy vai trò isAdmin)
- Modify: [SavedDocumentsLibrary.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/components/SavedDocumentsLibrary.tsx) (hiển thị badge tác giả cho admin)

---

## Tasks Checklist

### Task 1: Cập nhật Database Schema & Khởi chạy Migration

**Files:**
- Modify: [schema.prisma](file:///d:/VietElite/project_questionbank/prisma/schema.prisma)

- [ ] **Step 1: Cập nhật file `prisma/schema.prisma`**
  Thêm trường `export_count Int @default(0)` vào model `lms_questions`.
  ```prisma
  model lms_questions {
    id                  BigInt    @id @default(autoincrement())
    created_at          DateTime?
    updated_at          DateTime?
    // ... các trường khác giữ nguyên ...
    code                String?   @db.VarChar(6)
    export_count        Int       @default(0)

    topics              lms_topics_questions[]
    tags                lms_questions_tags[]

    @@index([created_by_id], map: "lms_questions_created_by_id")
    // ...
  }
  ```

- [ ] **Step 2: Khởi chạy lệnh tạo migration**
  Run: `npm run prisma:migrate -- --name add_export_count_to_questions`
  Expected: Prisma tạo migration thành công và cập nhật cấu trúc database MySQL.

---

### Task 2: Viết Script Đồng bộ Dữ liệu Cũ (Population Script)

**Files:**
- Create: `scripts/populate-export-count.ts`

- [ ] **Step 1: Tạo file script đồng bộ**
  Tạo file `scripts/populate-export-count.ts` sử dụng Prisma Client để quét và cập nhật `export_count` cho toàn bộ câu hỏi dựa theo số lượng bản ghi liên quan trong bảng `lms_documents_custom_questions`.
  ```typescript
  import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  async function main() {
    console.log('Bắt đầu đồng bộ số lần sử dụng câu hỏi...');

    // 1. Nhóm và đếm số lần sử dụng của từng câu hỏi trong bảng liên kết đề custom
    const usages = await prisma.lms_documents_custom_questions.groupBy({
      by: ['question_id'],
      _count: {
        id: true,
      },
    });

    console.log(`Tìm thấy ${usages.length} câu hỏi đã được dùng trong các đề xuất.`);

    // 2. Cập nhật tuần tự vào bảng lms_questions
    let count = 0;
    for (const usage of usages) {
      const qId = usage.question_id;
      const useCount = usage._count.id;

      await prisma.lms_questions.update({
        where: { id: BigInt(qId) },
        data: {
          export_count: useCount,
        },
      });
      count++;
      if (count % 50 === 0) {
        console.log(`Đã cập nhật ${count}/${usages.length} câu hỏi...`);
      }
    }

    console.log('Hoàn thành cập nhật số lần sử dụng câu hỏi!');
  }

  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
  ```

- [ ] **Step 2: Chạy script thử nghiệm**
  Run: `npx tsx scripts/populate-export-count.ts`
  Expected: Log in ra màn hình trạng thái cập nhật thành công và không gặp lỗi kiểu dữ liệu.

---

### Task 3: Cập nhật API Lưu trữ khi Xuất đề PDF

**Files:**
- Modify: [route.ts](file:///d:/VietElite/project_questionbank/src/app/api/documentcustom/upload-and-save/route.ts)

- [ ] **Step 1: Sửa file `src/app/api/documentcustom/upload-and-save/route.ts`**
  Tìm đoạn code lưu quan hệ câu hỏi ở dòng 93-103 và thêm câu lệnh raw SQL cập nhật tăng `export_count` thêm 1 cho toàn bộ ID câu hỏi được xuất.
  ```typescript
      // Lưu quan hệ câu hỏi
      if (Array.isArray(questionIds) && questionIds.length > 0) {
        await tx.lms_documents_custom_questions.createMany({
          data: questionIds.map((qId: any) => ({
            created_at: new Date(),
            updated_at: new Date(),
            question_id: Number(qId),
            document_custom_id: doc.id,
          })),
        });

        // Tự động cộng dồn export_count của câu hỏi thêm 1
        const questionIdListStr = questionIds.map((id: any) => Number(id)).join(',');
        await tx.$executeRawUnsafe(
          `UPDATE lms_questions SET export_count = export_count + 1 WHERE id IN (${questionIdListStr})`
        );
      }
  ```

---

### Task 4: Cập nhật Giao diện hiển thị thống kê

**Files:**
- Modify: [QuestionListTable.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-list/components/QuestionListTable.tsx)
- Modify: [QuestionDetailModal.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-list/components/QuestionDetailModal.tsx)
- Modify: [QuestionLibrary.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/components/QuestionLibrary.tsx)

- [ ] **Step 1: Cập nhật `QuestionListTable.tsx`**
  Thêm cột "Lượt dùng" ở dòng 72 và render giá trị `q.export_count || 0` ở dòng 104.
  ```typescript
  // Tại thead (khoảng dòng 72):
  <th className="px-3 py-3 font-extrabold">Lượt dùng</th>
  <th className="px-3 py-3 font-extrabold">Người tạo</th>

  // Tại tbody (khoảng dòng 103):
  <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-primary">{q.export_count || 0}</td>
  <td className="px-3 py-3 whitespace-nowrap text-xs">{q.created_by_name || '—'}</td>
  ```

- [ ] **Step 2: Cập nhật `QuestionDetailModal.tsx`**
  Hiển thị badge đã dùng ở phần header.
  ```typescript
  // Khoảng dòng 68 (trong div hiển thị các badge):
  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">{q.question_type || '—'}</span>
  <span className="px-2 py-0.5 rounded bg-outline-variant/10 text-outline-variant text-[10px] font-bold uppercase">{q.grade ? `Lớp ${q.grade}` : '—'}</span>
  <span className="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">{q.question_difficulty || '—'}</span>
  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">Đã dùng: {q.export_count || 0} lần</span>
  ```

- [ ] **Step 3: Cập nhật `QuestionLibrary.tsx`**
  Hiển thị badge "đã dùng X" trên các thẻ chọn câu hỏi.
  ```typescript
  // Khoảng dòng 118 (trong khu vực hiển thị độ khó):
  {q.question_difficulty && (
    <span className={`text-[9px] font-bold uppercase ${q.question_difficulty === 'Khó' ? 'text-error' :
      q.question_difficulty === 'Trung Bình' ? 'text-warning' : 'text-success'
      }`}>
      {q.question_difficulty}
    </span>
  )}
  {/* Badge hiển thị số lượt dùng */}
  <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
    đã dùng {q.export_count || 0}
  </span>
  ```

---

### Task 5: Cấu hình Tiêu đề Xuất bản & Phân quyền Lịch sử Đề xuất

**Files:**
- Modify: [DocumentBuilder.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/components/DocumentBuilder.tsx)
- Modify: [useDocumentBuilder.ts](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/hooks/useDocumentBuilder.ts)
- Modify: [list/route.ts](file:///d:/VietElite/project_questionbank/src/app/api/documentcustom/list/route.ts)
- Modify: [useSavedDocumentsLibrary.ts](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/hooks/useSavedDocumentsLibrary.ts)
- Modify: [SavedDocumentsLibrary.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/documents/components/SavedDocumentsLibrary.tsx)

- [ ] **Step 1: Cấu hình dynamic `docType` ở Header**
  - Thêm thuộc tính `docType: string` vào `DocumentMetadata` trong `useDocumentBuilder.ts`.
  - Cập nhật hiển thị nhãn header ở `DocumentBuilder.tsx` bằng `{metadata.docType}` thay cho chữ cứng.
  - Thêm trường nhập liệu "Loại tài liệu" vào settings modal của `DocumentBuilder.tsx`.
- [ ] **Step 2: Phân quyền API danh sách tài liệu custom**
  - Cập nhật API route `/api/documentcustom/list` lọc danh sách theo `created_by_id = userId` cho các user không phải admin.
  - Nếu là admin, trả về tất cả kèm theo `created_by_name` (nick name hoặc username).
- [ ] **Step 3: Hiển thị badge người tạo cho Admin**
  - Lấy cờ `isAdmin` trong hook `useSavedDocumentsLibrary.ts`.
  - Hiển thị badge **"Bởi: <Tên người export>"** trong `SavedDocumentsLibrary.tsx` khi `isAdmin` bằng true.

---

## Verification Plan

### Manual Verification
1. Chạy lại dev server bằng lệnh `npm run dev:light`.
2. Kiểm tra trang `/question-list` hiển thị đúng cột "Lượt dùng" cho toàn bộ câu hỏi.
3. Bấm xem chi tiết một câu hỏi để kiểm tra badge "Đã dùng: X lần".
4. Truy cập trang biên soạn tài liệu `/documents`, mở thanh bên phải và kiểm tra các câu hỏi hiển thị badge "đã dùng X".
5. Thay đổi loại tài liệu trong Cấu hình Header, xác nhận chữ ở đầu trang soạn thảo thay đổi theo.
6. Đăng nhập tài khoản admin và thường, kiểm tra tab Lịch sử tài liệu:
   - Giáo viên thường chỉ thấy tài liệu của mình.
   - Admin thấy toàn bộ tài liệu và có badge ghi rõ người export.
