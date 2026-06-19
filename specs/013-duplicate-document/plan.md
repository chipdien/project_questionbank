# Tạo bản sao tài liệu tùy chỉnh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm tính năng "Tạo bản sao" cho tài liệu công khai do giáo viên khác sở hữu để giáo viên hiện tại tự do chỉnh sửa câu hỏi của bản sao sâu mà không ảnh hưởng tới bản gốc.

**Architecture:** 
1. Cập nhật Prisma Schema (`lms_documents`) thêm `copied_from_id` và chạy migration.
2. Viết Server Action `duplicateDocumentAction` trong file `src/lib/actions/document-library.action.ts` thực hiện deep copy document, deep copy câu hỏi, options, các quan hệ tag, topic, lesson và lưu vào database.
3. Cập nhật frontend `QuestionBankManager.tsx` và sidebar hiển thị nút "Tạo bản sao" cho tài liệu public không thuộc quyền sở hữu của user.
4. Xử lý logic loading, toast thông báo trùng lặp và tự động chọn tài liệu bản sao.

**Tech Stack:** Next.js (App Router), Prisma Client (MySQL), React (TypeScript), Tailwind CSS.

---

## File Changes Map
- **Prisma Schema**:
  - Modify: [schema.prisma](file:///d:/VietElite/project_questionbank/prisma/schema.prisma) (thêm `copied_from_id` vào `lms_documents`)
- **Server Actions**:
  - Modify: [document-library.action.ts](file:///d:/VietElite/project_questionbank/src/lib/actions/document-library.action.ts) (hoặc viết action mới trong đó để phục vụ nhân bản)
- **Frontend Components / Hooks**:
  - Modify: [QuestionBankManager.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-bank/components/QuestionBankManager.tsx) (Thêm nút copy vào giao diện)
  - Modify: [useQuestionBank.ts](file:///d:/VietElite/project_questionbank/src/app/(main)/question-bank/hooks/useQuestionBank.ts) (Thêm logic state loading, gọi duplicate action và cập nhật state danh sách)

---

## Tasks Checklist

### Task 1: Cập nhật Database Schema & Chạy Migration

**Files:**
- Modify: [schema.prisma](file:///d:/VietElite/project_questionbank/prisma/schema.prisma)

- [ ] **Step 1: Cập nhật file `prisma/schema.prisma`**
  Thêm trường `copied_from_id BigInt?` vào model `lms_documents` và tạo index.
  ```prisma
  model lms_documents {
    id               BigInt    @id @default(autoincrement())
    created_at       DateTime?
    updated_at       DateTime?
    created_by_id    BigInt?
    updated_by_id    BigInt?
    title            String?   @db.VarChar(255)
    teacher_owned    BigInt?
    public           String?   @db.VarChar(255)
    content          String?   @db.LongText
    session_id       BigInt?
    is_ai_classified Boolean?  @default(false)
    link_s3          String?   @db.Text
    link_s3_answer   String?   @db.Text
    copied_from_id   BigInt?   // Trỏ tới tài liệu gốc

    @@index([created_by_id], map: "lms_documents_created_by_id")
    @@index([session_id], map: "lms_documents_session_id")
    @@index([teacher_owned], map: "lms_documents_teacher_owned")
    @@index([updated_by_id], map: "lms_documents_updated_by_id")
    @@index([copied_from_id], map: "idx_lms_documents_copied_from_id")
  }
  ```

- [ ] **Step 2: Chạy migration để cập nhật database**
  Run: `npx prisma db push` (hoặc migrate dev nếu dự án quản lý migrate nghiêm ngặt).
  Expected: Database MySQL được cập nhật trường mới thành công.

---

### Task 2: Phát triển Server Action nhân bản sâu (Deep Copy)

**Files:**
- Modify: [document-library.action.ts](file:///d:/VietElite/project_questionbank/src/lib/actions/document-library.action.ts)

- [ ] **Step 1: Viết server action `duplicateDocumentAction`**
  Thêm hàm mới vào file `document-library.action.ts` để nhân bản document và câu hỏi:
  ```typescript
  export async function duplicateDocumentAction(docId: number) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { success: false, error: 'Bạn cần đăng nhập để thực hiện tác vụ này.' };
      }

      const userId = user.id;

      // 1. Kiểm tra xem đã có bản sao từ trước hay chưa
      const existingDuplicate = await prisma.lms_documents.findFirst({
        where: {
          copied_from_id: BigInt(docId),
          created_by_id: BigInt(userId),
        },
      });

      if (existingDuplicate) {
        return {
          success: true,
          alreadyExists: true,
          docId: Number(existingDuplicate.id),
        };
      }

      // 2. Lấy thông tin document gốc
      const originalDoc = await prisma.lms_documents.findFirst({
        where: { id: BigInt(docId) },
      });

      if (!originalDoc) {
        return { success: false, error: 'Không tìm thấy tài liệu gốc.' };
      }

      // 3. Thực hiện nhân bản sâu trong transaction
      const newDoc = await prisma.$transaction(async (tx) => {
        // Tạo document mới
        const createdDoc = await tx.lms_documents.create({
          data: {
            title: `Bản sao - ${originalDoc.title || 'Không tên'}`,
            content: originalDoc.content,
            link_s3: originalDoc.link_s3,
            link_s3_answer: originalDoc.link_s3_answer,
            copied_from_id: BigInt(docId),
            created_by_id: BigInt(userId),
            teacher_owned: BigInt(userId),
            public: '0', // Mặc định bản sao là private
            is_ai_classified: originalDoc.is_ai_classified,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Lấy tất cả quan hệ câu hỏi cũ
        const oldQuestionsRelations = await tx.lms_questions_documents.findMany({
          where: { document_id: BigInt(docId) },
        });

        const oldQuestionIds = oldQuestionsRelations.map((r) => r.question_id);

        if (oldQuestionIds.length > 0) {
          // Lấy thông tin chi tiết của tất cả câu hỏi cũ (cả main và sub)
          const oldQuestions = await tx.lms_questions.findMany({
            where: { id: { in: oldQuestionIds } },
          });

          // Tìm các câu hỏi phụ (sub) liên quan trực tiếp đến các câu hỏi main trên
          const mainQuestionIds = oldQuestions.filter(q => q.complex === 'main').map(q => q.id);
          let subQuestions: any[] = [];
          if (mainQuestionIds.length > 0) {
            subQuestions = await tx.lms_questions.findMany({
              where: { ref_question_id: { in: mainQuestionIds }, complex: 'sub' },
            });
          }

          // Gom tất cả các câu hỏi cần nhân bản
          const questionsToDuplicate = [...oldQuestions, ...subQuestions];
          const duplicatedQuestionsMap = new Map<string, bigint>(); // map: oldQuestionIdStr -> newQuestionId

          // Tách câu hỏi cha (main/normal) và con (sub) để insert tuần tự và giữ ref_question_id
          const mainToCopy = questionsToDuplicate.filter(q => q.complex !== 'sub');
          const subToCopy = questionsToDuplicate.filter(q => q.complex === 'sub');

          // Copy câu hỏi cha trước
          for (const q of mainToCopy) {
            const newQ = await tx.lms_questions.create({
              data: {
                statement: q.statement,
                content: q.content,
                complex: q.complex,
                question_type: q.question_type,
                question_level: q.question_level,
                ref_question_id: null,
                public: '0',
                hint: q.hint,
                domain_id: q.domain_id,
                grade: q.grade,
                active: q.active,
                process: q.process,
                status: q.status,
                question_difficulty: q.question_difficulty,
                code: q.code,
                created_by_id: BigInt(userId),
                teacher_owned_by_id: BigInt(userId),
                owned_by_id: BigInt(userId),
                created_at: new Date(),
                updated_at: new Date(),
              },
            });
            duplicatedQuestionsMap.set(q.id.toString(), newQ.id);

            // Copy options tương ứng
            const oldOptions = await tx.lms_options.findMany({
              where: { question_id: q.id },
            });
            if (oldOptions.length > 0) {
              await tx.lms_options.createMany({
                data: oldOptions.map((opt) => ({
                  content: opt.content,
                  weight: opt.weight,
                  order: opt.order,
                  set: opt.set,
                  question_id: newQ.id,
                  created_by_id: BigInt(userId),
                  created_at: new Date(),
                  updated_at: new Date(),
                })),
              });
            }

            // Sao chép các quan hệ (tags, topics, lessons)
            const oldTags = await tx.lms_questions_tags.findMany({ where: { question_id: q.id } });
            if (oldTags.length > 0) {
              await tx.lms_questions_tags.createMany({
                data: oldTags.map(t => ({
                  question_id: newQ.id,
                  tag_id: t.tag_id,
                  created_at: new Date(),
                })),
              });
            }

            const oldTopics = await tx.lms_topics_questions.findMany({ where: { question_id: q.id } });
            if (oldTopics.length > 0) {
              await tx.lms_topics_questions.createMany({
                data: oldTopics.map(tp => ({
                  question_id: newQ.id,
                  topic_id: tp.topic_id,
                  created_at: new Date(),
                  updated_at: new Date(),
                })),
              });
            }

            const oldLessons = await tx.lms_questions_lessons.findMany({ where: { question_id: q.id } });
            if (oldLessons.length > 0) {
              await tx.lms_questions_lessons.createMany({
                data: oldLessons.map(l => ({
                  question_id: newQ.id,
                  lesson_id: l.lesson_id,
                  created_at: new Date(),
                  updated_at: new Date(),
                })),
              });
            }
          }

          // Copy câu hỏi con (sub) và map ref_question_id đúng
          for (const q of subToCopy) {
            const newRefId = q.ref_question_id ? duplicatedQuestionsMap.get(q.ref_question_id.toString()) : null;
            if (!newRefId) continue; // Bỏ qua nếu không tìm thấy cha mới

            const newQ = await tx.lms_questions.create({
              data: {
                statement: q.statement,
                content: q.content,
                complex: q.complex,
                question_type: q.question_type,
                question_level: q.question_level,
                ref_question_id: newRefId,
                public: '0',
                hint: q.hint,
                domain_id: q.domain_id,
                grade: q.grade,
                active: q.active,
                process: q.process,
                status: q.status,
                question_difficulty: q.question_difficulty,
                code: q.code,
                created_by_id: BigInt(userId),
                teacher_owned_by_id: BigInt(userId),
                owned_by_id: BigInt(userId),
                created_at: new Date(),
                updated_at: new Date(),
              },
            });
            duplicatedQuestionsMap.set(q.id.toString(), newQ.id);

            // Copy options cho sub question
            const oldOptions = await tx.lms_options.findMany({
              where: { question_id: q.id },
            });
            if (oldOptions.length > 0) {
              await tx.lms_options.createMany({
                data: oldOptions.map((opt) => ({
                  content: opt.content,
                  weight: opt.weight,
                  order: opt.order,
                  set: opt.set,
                  question_id: newQ.id,
                  created_by_id: BigInt(userId),
                  created_at: new Date(),
                  updated_at: new Date(),
                })),
              });
            }
          }

          // Tạo liên kết giữa các câu hỏi cha mới nhân bản vào document mới
          const newDocQuestionRelations = oldQuestions.map(oq => {
            const newQId = duplicatedQuestionsMap.get(oq.id.toString());
            return {
              document_id: createdDoc.id,
              question_id: newQId!,
              created_at: new Date(),
              updated_at: new Date(),
            };
          }).filter(r => r.question_id !== undefined);

          if (newDocQuestionRelations.length > 0) {
            await tx.lms_questions_documents.createMany({
              data: newDocQuestionRelations,
            });
          }
        }

        return createdDoc;
      });

      return {
        success: true,
        alreadyExists: false,
        docId: Number(newDoc.id),
      };
    } catch (error: any) {
      console.error('Lỗi khi tạo bản sao tài liệu:', error);
      return { success: false, error: error.message || 'Có lỗi xảy ra khi tạo bản sao.' };
    }
  }
  ```

---

### Task 3: Tích hợp Giao diện Nút Tạo Bản Sao

**Files:**
- Modify: [QuestionBankManager.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-bank/components/QuestionBankManager.tsx)
- Modify: [useQuestionBank.ts](file:///d:/VietElite/project_questionbank/src/app/(main)/question-bank/hooks/useQuestionBank.ts)

- [ ] **Step 1: Cập nhật component `DocumentItem` trong `QuestionBankManager.tsx`**
  Thêm nút "Tạo bản sao" (sử dụng icon copy/duplicate) cạnh tên tài liệu công khai nếu tài liệu đó không phải của user đang đăng nhập.
  ```typescript
  // Cần truyền prop: currentUserId, onDuplicate, isDuplicating
  // ...
  const showDuplicateBtn = doc.public === '1' && doc.created_by_id !== currentUserId && doc.teacher_owned !== currentUserId;
  // ...
  // Hiển thị icon bấm duplicate
  ```

- [ ] **Step 2: Định nghĩa logic action duplicate trong `useQuestionBank.ts`**
  Thêm state quản lý `isDuplicating`, lấy `currentUser` để so sánh ownership.
  Tạo hàm `handleDuplicateDoc` để gọi `duplicateDocumentAction` server action.
  ```typescript
  // logic handler:
  const handleDuplicateDoc = async (docId: number) => {
    setIsDuplicating(true);
    try {
      const res = await duplicateDocumentAction(docId);
      if (res.success) {
        if (res.alreadyExists) {
          toast.success('Bạn đã tạo bản sao cho tài liệu này từ trước. Đang chuyển hướng...');
        } else {
          toast.success('Đã tạo bản sao tài liệu thành công!');
        }
        // Gọi reload danh sách tệp hoặc reload route
        // Tự động chọn tài liệu bản sao: handleDocClick(res.docId)
      } else {
        toast.error(res.error || 'Nhân bản thất bại');
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsDuplicating(false);
    }
  }
  ```

---

## Verification Plan

### Automated Tests
*Vì codebase chủ yếu test bằng manual testing và chưa có khung test Jest/Playwright setup sẵn cho route này, ta sẽ ưu tiên Manual Verification.*

### Manual Verification
1. Đăng nhập bằng tài khoản Giáo viên thường (non-admin).
2. Vào màn `/question-bank`, chọn tab **DANH SÁCH TỆP**.
3. Chọn một tài liệu Public do giáo viên khác sở hữu -> Xác nhận thấy nút "Tạo bản sao" xuất hiện.
4. Bấm nút "Tạo bản sao" lần đầu tiên:
   - Xác nhận có màn hình loading nhẹ (hoặc button disabling).
   - Xác nhận toast "Đã tạo bản sao tài liệu thành công!".
   - Xác nhận hệ thống reload danh sách tệp, tự động chuyển hướng và chọn tài liệu bản sao mới tạo đó (tên có tiền tố `Bản sao - `).
5. Quay lại tài liệu Public gốc ban đầu, bấm nút "Tạo bản sao" lần thứ 2:
   - Xác nhận toast "Bạn đã tạo bản sao cho tài liệu này từ trước. Đang chuyển hướng...".
   - Xác nhận hệ thống tự động chọn tài liệu bản sao đã tạo từ trước.
6. Thử chỉnh sửa một câu hỏi bất kỳ trong tài liệu bản sao vừa nhân bản -> Xác nhận cập nhật thành công và không ảnh hưởng tới nội dung câu hỏi trong tài liệu Public gốc ban đầu.
