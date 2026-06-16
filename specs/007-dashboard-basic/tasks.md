# Danh sách Nhiệm vụ: Trang Dashboard Thống kê Cơ bản

- [ ] **Phase 1: Chuẩn bị & Cấu trúc**
  - [ ] Tạo cấu trúc thư mục `/src/app/(main)/dashboard/components`
  - [ ] Cập nhật Sidebar trong `src/components/layout/Sidebar.tsx` (Thêm tab Dashboard, đổi icon Xử lý tài liệu)
  - [ ] Xác minh điều hướng sidebar chuyển tiếp chuẩn xác sang `/dashboard`

- [ ] **Phase 2: Truy vấn Dữ liệu (Prisma)**
  - [ ] Viết các câu lệnh truy vấn count và groupBy trong `src/app/(main)/dashboard/page.tsx`
  - [ ] Lấy danh sách 5 tài liệu mới nhất kèm thông tin người tạo (nếu có)
  - [ ] Chuẩn hóa dữ liệu (xử lý các giá trị `null`, viết hoa/thường, chuẩn hóa tên khối lớp, ánh xạ độ khó từ database)

- [ ] **Phase 3: Phát triển Giao diện UI**
  - [ ] Phát triển `DashboardContainer.tsx` quản lý layout chính
  - [ ] Phát triển `KpiCards.tsx` hiển thị 4 chỉ số KPI lớn
  - [ ] Phát triển `Distributions.tsx` hiển thị phân phối Khối lớp, Độ khó và Loại câu hỏi bằng CSS/Tailwind bar charts sinh động
  - [ ] Phát triển `RecentDocuments.tsx` hiển thị danh sách tài liệu mới nhất kèm đường dẫn xử lý nhanh

- [ ] **Phase 4: Kiểm thử & Đóng gói**
  - [ ] Chạy kiểm tra build `npm run build`
  - [ ] Xác thực số liệu Dashboard khớp 100% với dữ liệu database thực tế
  - [ ] Kiểm tra responsive trên các thiết bị mobile/tablet/desktop
