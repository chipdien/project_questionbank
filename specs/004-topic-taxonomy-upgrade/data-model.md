# Data Model Specification: Topic & Tagging Upgrade

## 1. Schema Prisma Đề Xuất

Chúng ta sẽ nâng cấp file `prisma/schema.prisma` với các cấu trúc sau:

### Nâng cấp `lms_topics`
Thêm trường `parent_id` tự tham chiếu và trường `path`.

```prisma
model lms_topics {
  id            BigInt    @id @default(autoincrement())
  created_at    DateTime?
  updated_at    DateTime?
  created_by_id BigInt?
  updated_by_id BigInt?
  subject_id    BigInt?
  title         String?   @db.VarChar(255)
  content       String?   @db.LongText
  syllabus_id   BigInt?
  code          String?   @db.VarChar(255)
  order_index   BigInt?
  
  // Các trường phục vụ cấu trúc đệ quy & Materialized Path
  parent_id     BigInt?
  path          String?   @db.VarChar(512)
  type          String?   @db.VarChar(50) // Ví dụ: 'SYLLABUS', 'DOMAIN', 'TOPIC', 'LESSON', 'SUB_LESSON'

  // Quan hệ tự tham chiếu trong Prisma
  parent        lms_topics?   @relation("TopicToTopic", fields: [parent_id], references: [id], onDelete: Cascade)
  children      lms_topics[]  @relation("TopicToTopic")

  // Quan hệ tới câu hỏi thông qua bảng trung gian
  questions     lms_topics_questions[]

  @@index([created_by_id], map: "lms_topics_created_by_id")
  @@index([syllabus_id], map: "lms_topics_syllabus_id")
  @@index([updated_by_id], map: "lms_topics_updated_by_id")
  @@index([parent_id])
  @@index([path]) // Đánh index cho trường path để tăng tốc query LIKE
}
```

### Thêm mô hình Thẻ tag `lms_tags` và bảng liên kết `lms_questions_tags`

```prisma
model lms_tags {
  id          BigInt    @id @default(autoincrement())
  name        String    @unique @db.VarChar(100)
  category    String    @db.VarChar(50) // Ví dụ: 'SOURCE', 'METHOD', 'SKILL'
  created_at  DateTime? @default(now())
  updated_at  DateTime? @updatedAt

  questions   lms_questions_tags[]

  @@index([name])
}

model lms_questions_tags {
  created_at  DateTime @default(now())
  question_id BigInt
  tag_id      BigInt

  // Quan hệ
  question    lms_questions @relation(fields: [question_id], references: [id], onDelete: Cascade)
  tag         lms_tags      @relation(fields: [tag_id], references: [id], onDelete: Cascade)

  @@id([question_id, tag_id])
  @@index([question_id], map: "idx_question_tags_question_id")
  @@index([tag_id], map: "idx_question_tags_tag_id")
}
```

*Lưu ý:* Cần thêm quan hệ `tags lms_questions_tags[]` vào model `lms_questions` hiện tại trong file `schema.prisma`.

---

## 2. Quy tắc chuyển đổi dữ liệu (Data Migration Rules)

Khi migrate từ dữ liệu cũ sang cấu trúc đệ quy mới của `lms_topics`:
1. Mọi Syllabus hiện có trong `lms_syllabus` sẽ được import thành các root node (`parent_id = NULL`, `path = {new_topic_id}/`, `type = 'SYLLABUS'`) trong bảng `lms_topics`.
2. Mọi Topic cũ liên kết với Syllabus sẽ được chuyển đổi thành các con trực tiếp của node Syllabus tương ứng (`parent_id = syllabus_topic_id`, `path = {syllabus_topic_id}/{new_topic_id}/`).
3. Mọi Lesson cũ liên kết với Topic cũ sẽ chuyển đổi thành con của node Topic đó.
4. Mọi mối quan hệ câu hỏi cũ (`lms_topics_questions` và `lms_questions_lessons`) sẽ được cập nhật lại tương ứng để trỏ về đúng các node trong bảng `lms_topics` thống nhất.
