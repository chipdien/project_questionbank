# Kế hoạch Triển khai: Realtime Requests Notifications

**Branch**: `014-realtime-request` | **Spec**: [spec.md](./spec.md)

## Summary
Triển khai hệ thống thông báo realtime cho luồng Request sử dụng công nghệ Server-Sent Events (SSE). Bao gồm việc tạo bảng `lms_notifications`, setup hệ thống Event Bus global của Node.js, cung cấp API stream để Client lắng nghe, và xây dựng UI chuông thông báo (kèm popup stack dạng Facebook). Cuối cùng là chức năng click vào thông báo sẽ điều hướng sang trang `/requests` và tự động mở modal tương ứng.

### Giải pháp kỹ thuật
1. **Database Migration**: Thêm model `lms_notifications` vào `schema.prisma`.
2. **Backend SSE**:
   - `lib/eventEmitter.ts`: Khởi tạo và export global `EventEmitter`.
   - `app/api/notifications/stream/route.ts`: API Route trả về stream. Lắng nghe `EventEmitter` và push data.
   - `app/api/notifications/read/route.ts`: API đánh dấu đã đọc.
3. **Backend Logic**: Hook vào các actions hiện có (tạo request, duyệt, từ chối) để ghi dữ liệu vào bảng notification và emit event.
4. **Frontend Context**:
   - `components/providers/NotificationProvider.tsx`: Khởi tạo `EventSource`, lưu state (unreadCount, notifications array).
5. **Frontend UI**:
   - Sửa đổi `TopNavBar` (hoặc component Header) để tích hợp `NotificationBell` và `NotificationPopup`.
   - Component `NotificationPopup` liệt kê danh sách, nhấn vào -> gọi API read -> router.push(`/requests?requestId=x`).
6. **Integration**: Trang `/requests` nhận diện URL param `requestId` để tự động kích hoạt state mở Modal chi tiết.

## Technical Context

**Language/Version**: TypeScript, React 19, Next.js 16 App Router
**Storage**: MySQL qua Prisma
**Realtime Tech**: Server-Sent Events (Native Browser API) + Node.js EventEmitter
**Constraints**: Do chạy Next.js trên VPS, ta sử dụng global object để lưu instance của EventEmitter để chia sẻ giữa các request handler.

## Project Structure

```text
specs/014-realtime-request/
├── spec.md
├── plan.md
├── data-model.md
└── tasks.md
```

```text
prisma/
└── schema.prisma                           # SỬA: thêm bảng lms_notifications

src/
├── lib/
│   └── eventEmitter.ts                     # MỚI: Global event bus
├── app/api/notifications/
│   ├── stream/route.ts                     # MỚI: SSE Endpoint
│   └── read/route.ts                       # MỚI: Mark as read Endpoint
├── actions/
│   └── question-request.ts                 # SỬA: Thêm logic tạo notification và emit
├── components/
│   ├── providers/
│   │   └── NotificationProvider.tsx        # MỚI: Context & EventSource handler
│   └── notifications/
│       ├── NotificationBell.tsx            # MỚI: UI Chuông
│       └── NotificationPopup.tsx           # MỚI: UI Popup list
├── app/(main)/layout.tsx                   # SỬA: Wrap NotificationProvider
└── app/(main)/requests/page.tsx            # SỬA: Bắt param requestId để auto-open modal
```

## Phases
- Phase 1: Database & Event Bus Setup.
- Phase 2: Backend SSE API & Notification Actions.
- Phase 3: Frontend Provider & UI Components.
- Phase 4: Integration (Auto-open Modal).
