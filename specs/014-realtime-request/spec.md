# Feature Specification: Thông báo Realtime cho Yêu cầu Câu hỏi (Realtime Requests Notifications)

**Feature Branch**: `014-realtime-request`
**Status**: Draft

## Tổng quan
Xây dựng hệ thống thông báo realtime cho luồng Request (Giáo viên <-> Admin). 
- Khi Giáo viên gửi đề xuất sửa/phân loại/báo lỗi -> Admin nhận thông báo realtime.
- Khi Admin phê duyệt/từ chối đề xuất -> Giáo viên nhận thông báo realtime.
- Sử dụng Server-Sent Events (SSE) để tiết kiệm tài nguyên và dễ dàng thiết lập trên môi trường VPS chạy Node.js (aaPanel).
- Giao diện: Chuông thông báo hiển thị badge số lượng chưa đọc. Khi click sẽ xổ xuống danh sách thông báo dạng stack giống Facebook. Khi click vào thông báo sẽ mở trang `/requests` và tự động mở chi tiết Request đó.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin nhận thông báo khi có Request mới
Là Admin, tôi muốn nhận được thông báo ngay lập tức khi một giáo viên gửi bất kỳ yêu cầu nào, để tôi có thể xử lý kịp thời mà không cần f5 trang.

**Acceptance Scenarios**:
1. **Given** Admin đang online, **When** Giáo viên A tạo một Request, **Then** chuông thông báo của Admin nảy số +1 ngay lập tức.
2. **Given** Admin click vào chuông, **When** xem danh sách, **Then** hiển thị thông báo mới nhất: "Giáo viên A vừa gửi yêu cầu sửa câu hỏi...".

### User Story 2 - Giáo viên nhận thông báo khi Request được xử lý
Là Giáo viên, tôi muốn biết ngay khi Admin duyệt hoặc từ chối đề xuất của mình.

**Acceptance Scenarios**:
1. **Given** Giáo viên đang online, **When** Admin duyệt/từ chối một Request của giáo viên đó, **Then** chuông thông báo của Giáo viên nảy số +1.
2. **Given** Giáo viên click vào chuông, **When** xem danh sách, **Then** thấy thông báo: "Yêu cầu của bạn đã được Admin phê duyệt".

### User Story 3 - Click thông báo mở Modal Request
Là User (Admin/Giáo viên), khi tôi click vào một thông báo, tôi muốn được chuyển thẳng đến trang quản lý và xem chi tiết yêu cầu đó.

**Acceptance Scenarios**:
1. **Given** User đang ở trang bất kỳ, **When** click vào 1 thông báo chưa đọc, **Then** gọi API đánh dấu đã đọc -> badge chuông giảm 1.
2. **Given** User đã click, **Then** chuyển hướng trình duyệt tới `/requests?requestId=123`.
3. **Given** Trang `/requests` load xong, **Then** tự động mở Modal chi tiết Request có ID = 123.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001 (Schema)**: Thêm bảng `lms_notifications` vào `prisma/schema.prisma` với các trường: `id`, `user_id`, `type`, `title`, `content`, `reference_id` (chứa request_id), `is_read`, `created_at`.
- **FR-002 (Event Bus)**: Tạo `lib/eventEmitter.ts` khởi tạo Node `EventEmitter` gán vào biến `global` để dùng chung giữa các API Route.
- **FR-003 (SSE API)**: API `GET /api/notifications/stream` trả về `text/event-stream`. Khi khởi tạo, truy xuất DB gửi số lượng chưa đọc hiện tại. Sau đó listen trên `EventEmitter` và đẩy event về khi có thông báo mới thuộc về `user_id` đang kết nối.
- **FR-004 (Trigger Event)**: Sửa các server actions tạo/duyệt/từ chối Request (từ nhánh `011`) để thêm logic tạo bản ghi `lms_notifications` và gọi `eventEmitter.emit`.
- **FR-005 (Frontend Context)**: Tạo `NotificationProvider` wrap ứng dụng, duy trì kết nối `EventSource` tới API stream và lưu trữ trạng thái danh sách thông báo.
- **FR-006 (UI Components)**: Sửa lại icon Chuông trên `TopNavBar`. Thêm `NotificationPopup` liệt kê thông báo.
- **FR-007 (Auto Open Modal)**: Sửa trang `/requests` để nhận diện query param `?requestId=...` và tự động hiển thị modal chi tiết của request đó.

### Key Entities
- **lms_notifications**: Bảng mới lưu trữ nội dung thông báo.
- **lms_requests**: Liên kết reference để điều hướng.
