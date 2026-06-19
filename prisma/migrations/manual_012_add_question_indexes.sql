-- Migration: 012_add_question_indexes
-- Date: 2026-06-18
-- Purpose: Tối ưu hiệu năng truy vấn lms_questions (33k+ dòng).
--   Trước đây các cột lọc/groupBy không có index => full table scan trên Dashboard
--   (groupBy grade/question_type/question_difficulty) và bộ lọc danh sách câu hỏi
--   (complex, public, ref_question_id). Thêm index single-column cho các cột này.
-- Chỉ THÊM index, không sửa/xóa cột hay index hiện có (an toàn, additive).
-- Áp dụng trực tiếp bằng CREATE INDEX (relationMode = "prisma", không dùng shadow DB).

CREATE INDEX idx_lms_questions_grade               ON lms_questions (grade);
CREATE INDEX idx_lms_questions_question_type       ON lms_questions (question_type);
CREATE INDEX idx_lms_questions_question_difficulty ON lms_questions (question_difficulty);
CREATE INDEX idx_lms_questions_complex             ON lms_questions (complex);
CREATE INDEX idx_lms_questions_public              ON lms_questions (public);
CREATE INDEX idx_lms_questions_ref_question_id     ON lms_questions (ref_question_id);
