import prisma from '../db/prisma';

async function migrateData() {
  console.log('=== BẮT ĐẦU MIGRATION DI CHUYỂN DỮ LIỆU CŨ SANG CẤU TRÚC ĐỆ QUY ===');

  // 1. Gán 'TOPIC' cho tất cả lms_topics hiện có (nếu type chưa được set)
  console.log('Cập nhật type = "TOPIC" cho các topics hiện tại...');
  await prisma.lms_topics.updateMany({
    where: {
      type: null
    },
    data: {
      type: 'TOPIC'
    }
  });

  // 2. Chuyển đổi lms_syllabus thành các root node trong lms_topics
  console.log('Chuyển đổi lms_syllabus sang lms_topics...');
  const syllabuses = await prisma.lms_syllabus.findMany();
  console.log(`Tìm thấy ${syllabuses.length} syllabuses cũ.`);

  // Map lưu trữ id của syllabus cũ sang id của node topic mới
  const syllabusIdMap = new Map<bigint, bigint>();

  for (const syllabus of syllabuses) {
    // Kiểm tra xem đã tạo topic tương ứng cho syllabus này chưa
    const existing = await prisma.lms_topics.findFirst({
      where: {
        title: syllabus.title,
        type: 'SYLLABUS'
      }
    });

    let newSyllabusTopicId: bigint;

    if (existing) {
      newSyllabusTopicId = existing.id;
      console.log(`Syllabus "${syllabus.title}" đã tồn tại dưới dạng topic. Bỏ qua tạo mới.`);
    } else {
      const created = await prisma.lms_topics.create({
        data: {
          title: syllabus.title,
          content: syllabus.description,
          code: syllabus.code,
          order_index: syllabus.order_index,
          type: 'SYLLABUS'
        }
      });
      newSyllabusTopicId = created.id;
      console.log(`Đã tạo topic cho Syllabus: "${syllabus.title}" (ID mới: ${newSyllabusTopicId})`);
    }

    // Cập nhật path cho Syllabus topic root: {id}/
    await prisma.lms_topics.update({
      where: { id: newSyllabusTopicId },
      data: {
        path: `${newSyllabusTopicId}/`
      }
    });

    syllabusIdMap.set(syllabus.id, newSyllabusTopicId);
  }

  // 3. Liên kết lms_topics hiện tại vào các Syllabus tương ứng và cập nhật path
  console.log('Cập nhật parent_id và path cho lms_topics hiện tại...');
  const topics = await prisma.lms_topics.findMany({
    where: {
      type: 'TOPIC',
      syllabus_id: { not: null }
    }
  });

  console.log(`Tìm thấy ${topics.length} topics cũ cần cấu trúc lại.`);

  for (const topic of topics) {
    if (!topic.syllabus_id) continue;
    const newParentId = syllabusIdMap.get(topic.syllabus_id);

    if (newParentId) {
      const computedPath = `${newParentId}/${topic.id}/`;
      await prisma.lms_topics.update({
        where: { id: topic.id },
        data: {
          parent_id: newParentId,
          path: computedPath
        }
      });
    }
  }

  // 4. Chuyển đổi lms_lessons sang lms_topics (type = 'LESSON') và tạo map quan hệ câu hỏi
  console.log('Chuyển đổi lms_lessons sang lms_topics...');
  const lessons = await prisma.lms_lessons.findMany();
  console.log(`Tìm thấy ${lessons.length} lessons cũ.`);

  for (const lesson of lessons) {
    if (!lesson.name) continue;

    // Xem bài học này thuộc topic cha nào
    const parentTopicId = lesson.topic_id;

    let computedPath = '';
    if (parentTopicId) {
      const parentTopic = await prisma.lms_topics.findUnique({
        where: { id: parentTopicId },
        select: { path: true }
      });
      if (parentTopic && parentTopic.path) {
        computedPath = parentTopic.path;
      }
    }

    // Tạo node lesson trong lms_topics
    const existingLessonTopic = await prisma.lms_topics.findFirst({
      where: {
        title: lesson.name,
        type: 'LESSON',
        parent_id: parentTopicId
      }
    });

    let newLessonTopicId: bigint;
    if (existingLessonTopic) {
      newLessonTopicId = existingLessonTopic.id;
    } else {
      const created = await prisma.lms_topics.create({
        data: {
          title: lesson.name,
          code: lesson.code,
          order_index: lesson.order_index,
          parent_id: parentTopicId,
          type: 'LESSON'
        }
      });
      newLessonTopicId = created.id;
    }

    // Cập nhật path cho Lesson
    await prisma.lms_topics.update({
      where: { id: newLessonTopicId },
      data: {
        path: `${computedPath}${newLessonTopicId}/`
      }
    });

    // Chuyển đổi liên kết câu hỏi từ lms_questions_lessons sang lms_topics_questions
    const oldQuestionLinks = await prisma.lms_questions_lessons.findMany({
      where: { lesson_id: lesson.id }
    });

    if (oldQuestionLinks.length > 0) {
      console.log(`Đang chuyển đổi ${oldQuestionLinks.length} liên kết câu hỏi của Lesson "${lesson.name}"...`);
      for (const link of oldQuestionLinks) {
        // Kiểm tra xem liên kết đã có trong lms_topics_questions chưa
        const existingLink = await prisma.lms_topics_questions.findUnique({
          where: {
            topic_id_question_id: {
              topic_id: newLessonTopicId,
              question_id: link.question_id
            }
          }
        });

        if (!existingLink) {
          await prisma.lms_topics_questions.create({
            data: {
              topic_id: newLessonTopicId,
              question_id: link.question_id,
              created_at: new Date(),
              updated_at: new Date()
            }
          }).catch(() => {
            // Tránh lỗi nếu bị trùng lặp
          });
        }
      }
    }
  }

  console.log('=== DI CHUYỂN DỮ LIỆU CŨ HOÀN TẤT THÀNH CÔNG ===');
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
