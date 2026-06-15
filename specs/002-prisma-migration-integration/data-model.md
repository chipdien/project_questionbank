# Data Model: Sơ đồ thực thể Prisma

Dưới đây là thiết kế ánh xạ các bảng cơ sở dữ liệu hiện tại từ `vietelite_qb.sql` sang các Model của Prisma trong `schema.prisma`.

---

## 1. Các thực thể chính

### Model `lms_users` (Quản lý người dùng)
* **Bảng tương ứng:** `lms_users`
* **Cấu trúc Prisma:**
  ```prisma
  model lms_users {
    id         Int      @id
    email      String   @unique @db.VarChar(255)
    username   String   @db.VarChar(255)
    nickname   String?  @db.VarChar(255)
    level_rank Int?     @default(0)
    created_at DateTime @default(now()) @db.Timestamp
    updated_at DateTime @updatedAt @db.Timestamp
  }
  ```

### Model `lms_syllabus` (Khung chương trình)
* **Bảng tương ứng:** `lms_syllabus`
* **Cấu trúc Prisma:**
  ```prisma
  model lms_syllabus {
    id            BigInt    @id @default(autoincrement())
    created_at    DateTime? @db.DateTime(3)
    updated_at    DateTime? @db.DateTime(3)
    created_by_id BigInt?
    updated_by_id BigInt?
    title         String?   @db.VarChar(255)
    description   String?   @db.LongText
    grade         Float?
    domain_id     BigInt?
    public        String?   @default("1") @db.VarChar(255)
    code          String?   @db.VarChar(255)
    order_index   BigInt?
    topics        lms_topics[]
  }
  ```

### Model `lms_topics` (Chuyên đề)
* **Bảng tương ứng:** `lms_topics`
* **Cấu trúc Prisma:**
  ```prisma
  model lms_topics {
    id            BigInt        @id @default(autoincrement())
    created_at    DateTime?     @db.DateTime(3)
    updated_at    DateTime?     @db.DateTime(3)
    created_by_id BigInt?
    updated_by_id BigInt?
    subject_id    BigInt?
    title         String?       @db.VarChar(255)
    content       String?       @db.LongText
    syllabus_id   BigInt?
    code          String?       @db.VarChar(255)
    order_index   BigInt?
    syllabus      lms_syllabus? @relation(fields: [syllabus_id], references: [id], onDelete: Cascade)
    lessons       lms_lessons[]
    questions     lms_topics_questions[]
  }
  ```

### Model `lms_lessons` (Bài học)
* **Bảng tương ứng:** `lms_lessons`
* **Cấu trúc Prisma:**
  ```prisma
  model lms_lessons {
    id            BigInt                 @id @default(autoincrement())
    created_at    DateTime?              @db.DateTime(3)
    updated_at    DateTime?              @db.DateTime(3)
    created_by_id BigInt?
    updated_by_id BigInt?
    name          String?                @db.VarChar(255)
    code          String?                @db.VarChar(255)
    topic_id      BigInt?
    order_index   BigInt?
    grade         Float?
    domain_id     BigInt?
    topic         lms_topics?            @relation(fields: [topic_id], references: [id], onDelete: Cascade)
    sessions      lms_lessons_sessions[]
    questions     lms_questions_lessons[]
  }
  ```

### Model `lms_lessons_sessions` (Buổi học / Nội dung)
* **Bảng tương ứng:** `lms_lessons_sessions`
* **Cấu trúc Prisma:**
  ```prisma
  model lms_lessons_sessions {
    id            BigInt       @id @default(autoincrement())
    created_at    DateTime?    @db.DateTime(3)
    updated_at    DateTime?    @db.DateTime(3)
    created_by_id BigInt?
    updated_by_id BigInt?
    lesson_id     BigInt?
    name          String?      @db.VarChar(255)
    type          String?      @default("CONTENT") @db.VarChar(255)
    body          String?      @db.LongText
    order_index   BigInt?
    lesson        lms_lessons? @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  }
  ```

---

## 2. Các thực thể liên kết nhiều - nhiều (Many-to-Many Relationships)

Prisma cho phép ánh xạ chính xác các bảng quan hệ nhiều-nhiều có khóa chính phức hợp:

### Model `lms_topics_questions`
* **Bảng tương ứng:** `lms_topics_questions`
* **Cấu trúc Prisma:**
  ```prisma
  model lms_topics_questions {
    created_at  DateTime   @db.DateTime
    updated_at  DateTime   @db.DateTime
    topic_id    BigInt
    question_id BigInt
    topic       lms_topics @relation(fields: [topic_id], references: [id], onDelete: Cascade)
    question    lms_questions @relation(fields: [question_id], references: [id], onDelete: Cascade)

    @@id([topic_id, question_id])
  }
  ```

### Model `lms_questions_lessons`
* **Bảng tương ứng:** `lms_questions_lessons`
* **Cấu trúc Prisma:**
  ```prisma
  model lms_questions_lessons {
    created_at  DateTime    @db.DateTime
    updated_at  DateTime    @db.DateTime
    question_id BigInt
    lesson_id   BigInt
    lesson      lms_lessons @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
    question    lms_questions @relation(fields: [question_id], references: [id], onDelete: Cascade)

    @@id([question_id, lesson_id])
  }
  ```
