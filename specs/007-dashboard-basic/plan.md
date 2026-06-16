# Kế hoạch Triển khai: Trang Dashboard Thống kê Cơ bản

**Branch**: `giapcn` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

---

## 📝 Tóm tắt giải pháp (Summary)
Thiết lập trang Dashboard hiển thị thông tin thống kê cơ bản cho Ngân hàng câu hỏi tại đường dẫn `/dashboard`. 
Giải pháp bao gồm:
1. **Sidebar Link**: Cập nhật `src/components/layout/Sidebar.tsx` để thêm tab điều hướng `/dashboard` và thay đổi biểu tượng của "Xử lý tài liệu" sang `FolderSync` nhằm tránh trùng lặp biểu tượng `LayoutDashboard`.
2. **Dashboard Server Component**: Tạo trang `src/app/(main)/dashboard/page.tsx` và Server Action `src/actions/dashboard.ts` để thực hiện truy vấn tối ưu từ database bằng Prisma. Sử dụng `Promise.all` để chạy song song các truy vấn cho chỉ số KPI, phân phối khối lớp, độ khó, loại câu hỏi và tài liệu gần đây.
3. **UI Components**: Tạo các component giao diện hiện đại trong `src/app/(main)/dashboard/components/DashboardContainer.tsx` và các sub-components (như `KpiCards.tsx`, `Distributions.tsx`, `RecentDocuments.tsx`) sử dụng phong cách Material Design 3 và Glassmorphism cao cấp của dự án.

---

## 🛠️ Ngữ cảnh kỹ thuật (Technical Context)
*   **Framework**: Next.js App Router (React 19).
*   **Database**: MySQL truy vấn qua Prisma ORM.
*   **Styling**: Tailwind CSS (v4), Lucide React cho biểu tượng.
*   **Performance Goals**: Trang Dashboard được tải hoàn toàn trên server (Server Component) giúp giảm thiểu JS tải xuống client và tối đa hóa SEO/Performance. Thời gian phản hồi < 300ms.

---

## 🏗️ Cấu trúc thư mục thay đổi (Project Structure Changes)

```text
src/
├── components/
│   └── layout/
│       └── Sidebar.tsx          # [MODIFY] Thêm tab Dashboard, đổi icon Xử lý tài liệu
├── actions/
│   └── dashboard.ts             # [NEW] Server Action xử lý truy vấn và map logic dữ liệu
├── app/
    └── (main)/
        └── dashboard/
            ├── page.tsx         # [NEW] Server Page gọi Action và render Container UI
            └── components/
                ├── DashboardContainer.tsx # [NEW] Layout chính và tiêu đề
                ├── KpiCards.tsx           # [NEW] Thẻ số liệu tổng quan (KPI)
                ├── Distributions.tsx      # [NEW] Thống kê Khối lớp & Độ khó (Biểu đồ CSS)
                └── RecentDocuments.tsx    # [NEW] Danh sách tài liệu mới tải lên
```

---

## ⚡ Chi tiết triển khai (Proposed Implementation Steps)

### Bước 1: Cập nhật Sidebar (`Sidebar.tsx`)
*   Đổi biểu tượng của item "Xử lý tài liệu" (đang liên kết tới `/`) từ `LayoutDashboard` thành `FolderSync`.
*   Thêm mới item `{ icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' }` lên đầu danh sách `navItems`.

### Bước 2: Tạo Server Action xử lý logic (`src/actions/dashboard.ts`)
*   Truy vấn các dữ liệu song song bằng Prisma:
    1. Tổng số câu hỏi, tài liệu, bộ sưu tập, chủ đề.
    2. Gom nhóm câu hỏi theo `grade` (Khối lớp) để tính tỷ lệ.
    3. Gom nhóm câu hỏi theo `question_difficulty` (Độ khó).
    4. Gom nhóm câu hỏi theo `question_type` (Loại câu hỏi).
    5. Danh sách 5 tài liệu (`lms_documents`) mới nhất, sắp xếp `created_at` giảm dần.
*   Định dạng và xử lý dữ liệu (chuẩn hóa tên khối lớp, ánh xạ độ khó và loại câu hỏi).

### Bước 3: Tạo trang Server Component (`dashboard/page.tsx`)
*   Gọi hàm `getDashboardStats()` từ file Action để lấy dữ liệu đã được map sẵn.
*   Truyền dữ liệu xuống Client Component / Presentational Components để render.
*   Hiển thị giao diện báo lỗi nếu kết nối cơ sở dữ liệu thất bại.

### Bước 3: Thiết kế các Dashboard Components
*   **KpiCards**: 4 card tương ứng 4 chỉ số KPI với gradient nhẹ, hover effect bóng bẩy.
*   **Distributions**:
    *   Cột trái: Biểu đồ thanh ngang CSS hiển thị Phân phối Khối lớp (Khối lớp 10, 11, 12, 9, 8, v.v.).
    *   Cột phải: Biểu đồ thanh dọc/ngang hoặc progress bars hiển thị Phân phối theo Độ khó và Loại câu hỏi.
*   **RecentDocuments**:
    *   Bảng hiển thị 5 tài liệu gần đây. Có badge trạng thái xử lý AI (`Đã phân loại AI` vs `Chưa phân loại AI`).
    *   Nút bấm liên kết nhanh dẫn đến trang Xử lý tài liệu cho file đó.

---

## 🔬 Kế hoạch Xác minh (Verification Plan)

### Automated/Local Build Checks
*   Chạy `npm run build` để đảm bảo không có lỗi type-checking TypeScript hoặc lỗi render tĩnh/động.

### Manual Verification
*   Truy cập `/dashboard` qua trình duyệt.
*   Kiểm tra tính phản hồi và độ mượt của giao diện khi hover qua các card KPI.
*   Kiểm tra xem số liệu hiển thị có khớp hoàn toàn với số lượng được in ra từ script `inspect-db.ts` hay không.
*   Xác minh liên kết trong sidebar hoạt động chính xác và hiển thị trạng thái active cho đúng tab hiện tại.
