# Danh sách Công việc (Tasks): Realtime Requests Notifications

- `[ ]` uncompleted tasks
- `[/]` in progress tasks (custom notation)
- `[x]` completed tasks

## Phase 1: Database & Event Bus
- `[x]` Cập nhật `prisma/schema.prisma` thêm bảng `lms_notifications`.
- `[x]` Chạy `npm run prisma:generate` và tạo migration `prisma migrate dev --name add_notifications_table` (Đã sử dụng `npx prisma db push` do lỗi phân quyền database shadow trên host).
- `[x]` Tạo file `src/lib/eventEmitter.ts`:
  - Khởi tạo instance của `events.EventEmitter`.
  - Khai báo global variable để không bị mất khi HMR (Hot Module Replacement) của Next.js chạy.

## Phase 2: Backend SSE API & Notification Actions
- `[x]` Viết API SSE tại `src/app/api/notifications/stream/route.ts`:
  - Khởi tạo `ReadableStream` với header `Content-Type: text/event-stream`.
  - Lấy danh sách thông báo chưa đọc hiện tại gửi cho client qua event `initial`.
  - Lắng nghe event `NEW_NOTIFICATION` trên `EventEmitter`.
  - Khi có thông báo mới, check `user_id` khớp thì đẩy chunk data xuống stream.
  - Xử lý đóng kết nối khi Client ngắt.
- `[x]` Viết API cập nhật `src/app/api/notifications/read/route.ts` để đổi trạng thái `is_read = true`.
- `[x]` Cập nhật các Server Actions trong `src/actions/question-request.ts` (đã cập nhật `src/lib/actions/question-request.action.ts`):
  - Hàm `createQuestionRequest`: Gọi logic insert `lms_notifications` tới user admin và emit event.
  - Hàm `approveQuestionRequest` & `rejectQuestionRequest`: Gọi logic insert notification tới user tạo request và emit event.

## Phase 3: Frontend Provider & UI Components
- `[x]` Tạo `src/components/providers/NotificationProvider.tsx`:
  - Dùng `EventSource` để kết nối tới `/api/notifications/stream`.
  - Export Context chứa danh sách thông báo và số lượng chưa đọc.
- `[x]` Bọc `NotificationProvider` trong layout chính (chỉ kích hoạt nếu đã login).
- `[x]` Tạo UI `NotificationBell` và `NotificationPopup` (với Tailwind CSS):
  - Hiển thị badge số.
  - Click vào chuông xổ ra danh sách 20 thông báo gần nhất.
  - Phân biệt style thông báo đã đọc/chưa đọc.
- `[x]` Thay thế chuông tĩnh hiện tại trong `TopNavBar` bằng `NotificationBell`.

## Phase 4: Integration (Auto-open Modal)
- `[x]` Cập nhật trang `src/app/(main)/requests/page.tsx`:
  - Lấy param `requestId` từ URL (ví dụ: `/requests?requestId=123`).
  - Nếu có `requestId`, tự động fetch request tương ứng và set `reviewing` trong hook để hiển thị modal `RequestReviewModal`.
- `[x]` Test toàn bộ luồng:
  - Dùng 2 browser (1 tab Admin, 1 tab Giáo viên).
  - Test tạo request -> chuông admin nhảy.
  - Test admin approve -> chuông giáo viên nhảy.
  - Test click thông báo -> modal bật ra.
