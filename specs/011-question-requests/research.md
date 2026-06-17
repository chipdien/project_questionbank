# Research (Phase 0): Question Requests

**Feature**: `011-question-requests` | **Date**: 2026-06-17

## R1. `lms_requests` có đủ không?

**Quyết định**: Dùng lại `lms_requests`, thêm 3 cột `question_id`, `status`, `admin_note`.

**Căn cứ**: Bảng đang **trống và không được dùng ở bất kỳ đâu** (grep toàn `src` không ra kết quả). Đã có sẵn ~80% cột cần thiết (`type`, `content`, `content_suggest`, `created_by_id`, `updated_by_id`, `title`, timestamps). Thiếu `question_id` (liên kết câu hỏi — bắt buộc) và `status` (vòng đời duyệt + ưu tiên). Thêm `admin_note` cho lý do từ chối.

**Phương án loại bỏ**: Tạo bảng mới `lms_question_requests` (C) — sẽ để `lms_requests` thành bảng chết vô dụng; không có nhu cầu request khác hiện tại. Nhét JSON vào `content_suggest` (B) — không query/sort theo câu hỏi & trạng thái → hỏng tính năng "ưu tiên request lên đầu".

## R2. Áp dụng đề xuất khi duyệt

**Quyết định**: Pre-fill thủ công (admin kiểm soát), tái dùng `classifyQuestions` (CLASSIFY) và `PATCH /api/questions/[id]` (EDIT); chỉ gọi `approveQuestionRequest` sau khi áp dụng thành công.

**Căn cứ**: Lựa chọn người dùng (đề xuất là gợi ý, admin toàn quyền). Tránh viết action ghi câu hỏi trùng lặp — đã có sẵn `classifyQuestions` và API sửa câu (có check quyền).

## R3. Ưu tiên câu có request trên `/question-list`

**Quyết định**: Mở rộng `getAllQuestions` (cờ `prioritizeRequests`), phân trang 2 đoạn (requested-first rồi phần còn lại).

**Căn cứ**: Người dùng chọn 2a (sửa code của chính mình). Không thể `orderBy` xuyên bảng trong Prisma; tập câu có request `PENDING` là hàng đợi admin (nhỏ) nên giữ trong bộ nhớ và ghép phân trang an toàn, giữ `total`/`totalPages` chính xác.

## R4. Modal chi tiết riêng cho `/question-list`

**Quyết định**: Tạo `QuestionDetailModal` mới, không dùng lại `QuestionModal`.

**Căn cứ**: Người dùng chọn 1b. `QuestionModal` dùng chung với Question Bank; thêm UI request vào đó sẽ ảnh hưởng trang khác. Modal mới vẫn tái dùng util render markdown/math nên trùng lặp ở mức chấp nhận được.

## R5. Badge trên icon chuông header

**Quyết định**: Tận dụng icon chuông `notifications` có sẵn trong `TopNavBar` (đang là placeholder) làm điểm vào + badge số.

**Căn cứ**: Người dùng yêu cầu. Badge role-aware qua `getPendingRequestCount` (admin = tổng `PENDING`; giáo viên = `PENDING` của họ). Bỏ badge ở sidebar để tránh trùng.

## R6. Phạm vi tạm loại

- Cơ chế "đã đọc" thông báo cho giáo viên → để sau (giáo viên badge tạm = `PENDING` của họ).
- "Duyệt câu" (kiểm duyệt bản thân câu hỏi) → để sau.
- Realtime/email, lọc năm học → ngoài phạm vi.
