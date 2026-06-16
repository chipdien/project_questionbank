# Đặc tả Tính năng: Trang Dashboard Thống kê Cơ bản

**Feature Branch**: `giapcn`
**Created**: 2026-06-16
**Status**: Draft
**Input**: Yêu cầu người dùng: "tôi muốn 1 tab Dashboard hiển thị vài thông tin cơ bản"

---

## 👥 Kịch bản Người dùng (User Scenarios)

### User Story 1 - Xem Tổng quan Số liệu Ngân hàng Câu hỏi (Priority: P1)
Là một Giáo viên hoặc Quản trị viên, tôi muốn xem nhanh tổng số câu hỏi, tài liệu, bộ sưu tập và chủ đề có trong hệ thống để nắm bắt quy mô dữ liệu hiện tại.

*   **Test Độc lập**: Truy cập trang `/dashboard` và kiểm tra các thẻ số liệu hiển thị đúng số lượng khớp với cơ sở dữ liệu thực tế.
*   **Acceptance Criteria**:
    1. **Given** Người dùng truy cập `/dashboard`, **When** trang tải xong, **Then** hệ thống hiển thị 4 thẻ thống kê chính: Tổng số câu hỏi, Tổng số tài liệu, Tổng số bộ sưu tập, Tổng số chủ đề.
    2. Các con số này được hiển thị rõ ràng, đi kèm biểu tượng trực quan từ thư viện `lucide-react`.

### User Story 2 - Phân tích Phân phối Câu hỏi (Priority: P1)
Là một Người quản lý Học vụ, tôi muốn xem biểu đồ phân phối câu hỏi theo Khối lớp và theo Độ khó để biết lượng câu hỏi đang tập trung ở phân khúc nào, từ đó có kế hoạch biên soạn bổ sung phù hợp.

*   **Test Độc lập**: Kiểm tra vùng phân phối khối lớp và độ khó hiển thị các thanh đo phần trăm/số lượng tương ứng một cách chính xác và trực quan.
*   **Acceptance Criteria**:
    1. **Given** Người dùng ở trang Dashboard, **When** cuộn xuống phần phân phối, **Then** hệ thống hiển thị danh sách các khối lớp (Lớp 10, Lớp 11, Lớp 12, Lớp 5, v.v.) cùng số lượng và tỷ lệ % câu hỏi tương ứng.
    2. Hệ thống hiển thị phân phối câu hỏi theo độ khó (Dễ, Trung bình, Khó, Cơ bản/Nâng cao) dựa trên dữ liệu từ cơ sở dữ liệu.

### User Story 3 - Hoạt động Gần đây (Priority: P2)
Là một Giáo viên, tôi muốn xem danh sách các tài liệu mới tải lên gần đây để nhanh chóng truy cập và tiếp tục xử lý.

*   **Test Độc lập**: Kiểm tra danh sách "Tài liệu mới nhất" hiển thị đúng tên tài liệu, thời gian tải lên và người tải.
*   **Acceptance Criteria**:
    1. **Given** Có tài liệu mới được tải lên hệ thống, **When** người dùng truy cập Dashboard, **Then** danh sách hoạt động gần đây hiển thị 5 tài liệu mới nhất được sắp xếp theo thời gian giảm dần.

---

## 📋 Yêu cầu Tính năng (Functional Requirements)

### FR-001: Điều hướng Sidebar (Sidebar Navigation)
*   Hệ thống PHẢI thêm một tab "Dashboard" vào menu chính trong `Sidebar.tsx`.
*   Tab này sử dụng biểu tượng `LayoutDashboard` và chuyển hướng đến URL `/dashboard`.
*   Vì nút "Xử lý tài liệu" hiện tại cũng đang dùng biểu tượng `LayoutDashboard`, hệ thống PHẢI đổi biểu tượng của "Xử lý tài liệu" thành biểu tượng phù hợp khác (ví dụ: `FolderSync` hoặc `Sliders` hoặc `FileText` / `FileSpreadsheet`).

### FR-002: Thẻ chỉ số KPI (KPI Summary Cards)
*   Trang `/dashboard` PHẢI hiển thị các thẻ KPI tổng quan với hiệu ứng hover mượt mà:
    *   **Tổng số câu hỏi**: Lấy từ bảng `lms_questions`.
    *   **Tổng số tài liệu**: Lấy từ bảng `lms_documents`.
    *   **Tổng số bộ sưu tập (Collections)**: Lấy từ bảng `lms_collections`.
    *   **Tổng số chủ đề (Topics)**: Lấy từ bảng `lms_topics`.

### FR-003: Phân phối theo Khối lớp (Questions by Grade)
*   Hệ thống PHẢI thống kê số lượng câu hỏi theo từng khối lớp có trong database.
*   Hiển thị dưới dạng biểu đồ thanh ngang (horizontal bar chart) tùy chỉnh bằng HTML/CSS để có giao diện hiện đại và tải nhanh, không cần thư viện biểu đồ cồng kềnh.

### FR-004: Phân phối theo Độ khó & Loại câu hỏi (Questions by Difficulty & Type)
*   Hệ thống PHẢI thống kê số lượng câu hỏi theo độ khó (Dễ, Trung bình, Khó, Cơ bản `cb`, Nâng cao `nc`, v.v.) và theo loại câu hỏi (Trắc nghiệm, Tự luận, Điền khuyết, Đúng/Sai).
*   Hiển thị trực quan với thanh tiến trình (Progress Bar) có màu sắc tương ứng.

### FR-005: Tài liệu mới nhất (Recent Documents)
*   Hệ thống PHẢI hiển thị danh sách 5 tài liệu tải lên gần đây nhất bao gồm tiêu đề, ngày tạo, trạng thái xử lý AI (`is_ai_classified`), và liên kết nhanh để xử lý tài liệu đó.

---

## 🎯 Tiêu chí Thành công (Success Criteria)

*   **SC-001**: Thời gian phản hồi và truy vấn database của trang `/dashboard` phải dưới **300ms** (sử dụng Prisma tối ưu, có thể dùng `Promise.all` để truy vấn song song).
*   **SC-002**: Giao diện Dashboard đẹp mắt, cao cấp, tuân thủ các quy chuẩn thiết kế premium (Glassmorphism, màu HSL hài hòa, hover micro-animations).
*   **SC-003**: 100% dữ liệu thống kê trên Dashboard khớp chính xác với dữ liệu thực tế trong MySQL.
