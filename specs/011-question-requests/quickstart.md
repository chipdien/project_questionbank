# Quickstart & Verification: Question Requests

**Feature**: `011-question-requests` | **Date**: 2026-06-17

## Chuẩn bị
- Chạy migration: `npx prisma migrate dev --name 011_add_question_request_fields` rồi `npx prisma generate`.
- `npm run dev`. Cần **2 tài khoản**: 1 admin (`level_rank >= 5`) và 1 giáo viên (non-admin).

## Kịch bản — Giáo viên
- [ ] Mở `/question-list`, bấm vào một câu → `QuestionDetailModal` mở, **không** có nút sửa trực tiếp.
- [ ] Bấm "Đề xuất phân loại" → chọn khối/chủ đề/tags + ghi chú → gửi → toast thành công; request `PENDING` hiện trong modal.
- [ ] Bấm "Đề xuất sửa" → nhập nội dung mới + lý do → gửi → lưu `EDIT`.
- [ ] Bấm "Báo lỗi" → mô tả + gợi ý → gửi → lưu `REPORT`.
- [ ] Bấm "Thêm vào collection" → `AddToCollectionModal` hoạt động như cũ.
- [ ] Vào `/requests` → chỉ thấy request của mình; bấm "Hủy" một request `PENDING` → chuyển `CANCELLED`.
- [ ] Icon chuông header hiển thị badge = số request `PENDING` của mình.

## Kịch bản — Admin
- [ ] Icon chuông header = tổng request `PENDING`; bấm → `/requests`.
- [ ] `/requests`: request `PENDING` lên đầu; lọc theo loại/trạng thái hoạt động.
- [ ] Mở `CLASSIFY` `PENDING` → "Áp dụng & duyệt" → form phân loại pre-fill → lưu → câu hỏi được phân loại + request `APPROVED`.
- [ ] Mở `EDIT` `PENDING` → "Áp dụng & duyệt" → form sửa pre-fill → lưu → câu hỏi cập nhật + `APPROVED`.
- [ ] Mở `REPORT` → đọc → "Đánh dấu đã xử lý" (`APPROVED`) hoặc "Từ chối".
- [ ] "Từ chối" + nhập lý do → `REJECTED` + `admin_note` hiển thị.
- [ ] Request đã xử lý → mở lại thấy nút duyệt/từ chối bị khóa.
- [ ] `/question-list` (admin): câu có request `PENDING` lên đầu + badge "N yêu cầu"; sau khi xử lý hết → mất ưu tiên & badge.

## Phân quyền
- [ ] Giáo viên gọi trực tiếp `approveQuestionRequest`/`rejectQuestionRequest` → bị từ chối ở server.
- [ ] Giáo viên không thấy nút sửa trực tiếp / duyệt.

## Hồi quy
- [ ] Trang `/question-bank` vẫn dùng `QuestionModal` cũ bình thường (không bị ảnh hưởng bởi `QuestionDetailModal`).
- [ ] `/question-list` của non-admin: thứ tự & phân trang như cũ (không bật ưu tiên).
- [ ] `npm run build` thành công, route `/requests` xuất hiện.

## Migration trace
- [ ] Xác nhận `lms_requests` có 3 cột mới + 2 index (xem `data-model.md` mục Migration log).
