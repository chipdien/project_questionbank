# Checklist Chất lượng Đặc tả: Trang Danh sách Câu hỏi

**Feature**: `010-page-list` | **Date**: 2026-06-17

## Tính đầy đủ
- [x] Mô tả rõ route mới và vị trí trong điều hướng (submenu "Xử lý tài liệu").
- [x] Xác định nguồn dữ liệu (action mới `getAllQuestions`, quét trực tiếp `lms_questions`).
- [x] Định nghĩa rõ "private" (`public='0'`) và xử lý `null`.
- [x] Định nghĩa rõ "chưa phân loại" (thiếu chủ đề HOẶC thiếu tag).
- [x] Liệt kê đầy đủ bộ lọc và mapping sang trường DB.
- [x] Liệt kê đầy đủ cột bảng (gồm Người tạo, Ngày tạo).
- [x] Xác định phân quyền hiển thị cho admin và non-admin.

## Tính nhất quán
- [x] Phân quyền nhất quán giữa spec, data-model, research.
- [x] "Loại bài" tách thành `question_type` + tag TYPE — nhất quán toàn bộ tài liệu.
- [x] Phạm vi loại trừ (năm học, sửa/phân loại, collection) ghi rõ ở Out of Scope.

## Tính rõ ràng / không mơ hồ
- [x] Mỗi FR có thể kiểm chứng.
- [x] Quy tắc câu hỏi chùm rõ ràng (`sub` ẩn, gộp vào cha).
- [x] Hành vi reset trang khi đổi filter rõ ràng.

## Phạm vi
- [x] Tập trung một trang duy nhất, không kéo theo refactor `question-bank`.
- [x] Tái sử dụng component dùng chung được chỉ định cụ thể.
- [x] Helper dùng chung tách riêng, không sửa `getLibraryQuestions`.

## Rủi ro đã ghi nhận
- [ ] Hiệu năng bộ lọc "chưa phân loại" trên ~33k câu — cần đo thực tế (T011).
- [ ] Xử lý `null` của `public` cho non-admin cần test kỹ (không lộ private, không ẩn nhầm câu chưa đánh dấu).
- [ ] Đảm bảo gộp câu chùm `sub` đúng theo `ref_question_id`.
