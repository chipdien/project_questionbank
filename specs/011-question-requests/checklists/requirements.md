# Checklist Chất lượng Đặc tả: Question Requests

**Feature**: `011-question-requests` | **Date**: 2026-06-17

## Tính đầy đủ
- [x] Xác định 3 loại request (EDIT/CLASSIFY/REPORT) + thao tác trực tiếp (collection).
- [x] Định nghĩa schema thay đổi rõ ràng + migration log (cột/kiểu/default/index).
- [x] Định nghĩa vòng đời trạng thái (PENDING/APPROVED/REJECTED/CANCELLED).
- [x] Phân bổ dữ liệu theo loại (content / content_suggest).
- [x] Cơ chế áp dụng đề xuất khi duyệt (tái dùng classifyQuestions / PATCH).
- [x] Phân quyền admin vs giáo viên cho từng action.
- [x] Điểm vào giáo viên (modal /question-list) và nơi admin xử lý (/requests + ưu tiên list + chuông).

## Tính nhất quán
- [x] Phân quyền nhất quán giữa spec/data-model/research.
- [x] Cờ `prioritizeRequests` & `pendingRequestCount` khớp giữa spec FR-016 và data-model mục 5.
- [x] Cross-reference với 010 được nêu rõ (getAllQuestions, QuestionDetailModal).

## Rõ ràng / không mơ hồ
- [x] "Duyệt" = áp dụng thủ công rồi approve (không auto-apply).
- [x] Hủy chỉ owner + PENDING; approve/reject chỉ PENDING.
- [x] Badge chuông role-aware định nghĩa rõ.

## Phạm vi
- [x] Out of scope ghi rõ: cơ chế đã đọc, "duyệt câu", realtime/email, năm học.
- [x] Tái dùng tối đa component/action sẵn có.
- [x] Migration tối thiểu (chỉ thêm cột).

## Rủi ro đã ghi nhận
- [ ] Phân trang 2 đoạn của `getAllQuestions` cần test kỹ ranh giới trang (đoạn requested ↔ phần còn lại).
- [ ] `content_suggest` JSON của CLASSIFY phải parse an toàn ở cả UI lẫn lúc áp dụng.
- [ ] `question_id` không FK → xử lý câu hỏi đã xóa.
- [ ] Đảm bảo `QuestionModal` (question-bank) không bị ảnh hưởng khi thay modal ở /question-list.
