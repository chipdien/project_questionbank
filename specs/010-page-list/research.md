# Research (Phase 0): Trang Danh sách Câu hỏi

**Feature**: `010-page-list` | **Date**: 2026-06-17

## R1. Quy ước trường `public` trên `lms_questions`

**Quyết định**: private = `public='0'`. `public='1'` và `public IS NULL` đều coi là hiển thị được (null = "chưa đánh dấu").

**Căn cứ**: Truy vấn thực tế DB:
| public | số lượng |
|--------|----------|
| `'1'`  | 31.071   |
| `'0'`  | 1.820    |
| `null` | 524      |

Code hiện có chỉ coi `public='1'` là công khai cho `lms_documents`. Áp dụng tương tự, đồng thời cho null vẫn hiển thị để không ẩn nhầm 524 câu chưa đánh dấu.

## R2. Phạm vi dữ liệu: toàn bộ câu hỏi vs câu hỏi theo tài liệu

**Quyết định**: viết action mới quét trực tiếp `lms_questions`, KHÔNG tái dùng `getLibraryQuestions`.

**Căn cứ**: `getLibraryQuestions` chỉ trả câu hỏi gắn với tài liệu user được xem (join `lms_questions_documents`). Yêu cầu là hiển thị **toàn bộ** câu hỏi trong DB (trừ private). Hai phạm vi khác nhau → tách action riêng rõ ràng hơn là thêm cờ vào hàm cũ (giảm rủi ro cho trang `question-bank`).

## R3. Hiệu năng bộ lọc "chưa phân loại"

**Quyết định**: dùng truy vấn gộp lấy 2 tập distinct `question_id` (từ `lms_topics_questions` và `lms_questions_tags`), giao nhau ra tập "đã đủ chủ đề + tag", rồi `where id notIn hasBoth`.

**Căn cứ**: DB ~33k câu. Lặp kiểm tra từng câu sẽ chậm. Thao tác tập hợp + `notIn` tận dụng index `question_id` trên 2 bảng nối. Cần giới hạn tập theo các điều kiện lọc khác trước để `notIn` không quá lớn.

**Phương án thay thế đã cân nhắc**: raw SQL với `LEFT JOIN ... WHERE topic IS NULL OR tag IS NULL` — nhanh nhưng khó kết hợp với các filter Prisma động; giữ làm phương án tối ưu nếu cần.

## R4. Định nghĩa "loại bài"

**Quyết định**: tách "Hình thức câu hỏi" (`question_type`) thành filter riêng; "lý thuyết/vận dụng" là tag nhóm TYPE, nằm trong khu vực lọc tags.

**Căn cứ**: trong mô hình dữ liệu, `question_type` (single_choice, multiple_choice, true_false, fill_in_the_blank, essay) khác với tag category TYPE. Gộp lẫn sẽ làm logic lọc phức tạp và khó bảo trì.

## R5. Mức tái sử dụng giao diện (Hướng 1)

**Quyết định**: tạo component mới riêng cho trang (`QuestionListFilterHeader`, `QuestionListTable`, `QuestionListManager`), tái dùng phần tử nhỏ dùng chung (`AppSelect`, `topic-tree-select`, `AppBadge`, `QuestionModal`).

**Căn cứ**:
- `QuestionFilterPanel` là panel dọc dạng checkbox — không khớp layout header ngang yêu cầu.
- `QuestionsDataGrid` nặng (chọn nhiều, add-to-collection, sửa) — vượt nhu cầu read-only.
- Tạo mới giữ trang `question-bank` không bị ảnh hưởng và cho layout đúng ý.

## R6. Tổ chức bộ lọc tags

**Quyết định**: một ô tag tổng hợp đa chọn, gom nhóm theo category bên trong (gồm cả nhóm TYPE).

**Căn cứ**: lựa chọn của người dùng (phương án B). Gọn header, vẫn phân biệt được category khi chọn.

## R7. Phân quyền hiển thị

**Quyết định**: admin (`level_rank >= 5`) thấy tất cả kể cả private; non-admin thấy `public IN ('1', null)` HOẶC câu của mình (bất kỳ cột sở hữu nào).

**Căn cứ**: lựa chọn của người dùng (Q8=C, Q9: ownership = bất kỳ cột; admin thấy cả private). Phục vụ workflow phân loại của admin sau này.

## R8. Phạm vi tạm loại

- "Năm học" (tag YEAR): tạm bỏ theo yêu cầu.
- Sửa/phân loại trực tiếp, chọn nhiều, add-to-collection: ngoài phạm vi.
