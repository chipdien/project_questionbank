# Tài liệu Thiết kế Giao diện (DESIGN.md)

Tài liệu này tóm tắt hệ thống thiết kế giao diện (Design System) của ứng dụng **VietElite - Question Bank**. Dự án sử dụng **Tailwind CSS v4** với cấu hình trực tiếp trong tệp CSS chính.

---

## 🎨 Bảng màu (Color Palette)

Hệ màu của hệ thống tuân theo bảng màu được định nghĩa trong `@theme` tại [globals.css](file:///Volumes/DATA/workspace/vietelite_questionbank/src/app/globals.css):

### 1. Hệ màu chính (Brand & Primary Colors)
* **Primary (Màu chủ đạo):** `#348E38` (Xanh lá VietElite)
  * `on-primary`: `#ffffff` (Chữ trên nền primary)
  * `primary-container`: `#e8f5e9`
  * `on-primary-container`: `#1b5e20`
* **Secondary (Màu phụ/Nhấn):** `#FFFF00` (Vàng)
  * `on-secondary`: `#191d19`
  * `secondary-container`: `#fffde7`
  * `on-secondary-container`: `#2b2600`
* **Tertiary:** `#4f6354`
  * `on-tertiary`: `#ffffff`
  * `tertiary-container`: `#dce5dd`
  * `on-tertiary-container`: `#0e2015`

### 2. Màu trạng thái (Semantic Colors)
* **Success (Thành công):** `#15803d`
  * `on-success`: `#ffffff`
  * `success-container`: `#dcfce7`
  * `on-success-container`: `#14532d`
* **Warning (Cảnh báo):** `#ca8a04`
  * `warning-dark`: `#854d0e`
  * `on-warning`: `#ffffff`
  * `warning-container`: `#fef9c3`
  * `on-warning-container`: `#713f12`
* **Error (Lỗi):** `#ba1a1a`
  * `on-error`: `#ffffff`
  * `error-container`: `#ffdad6`
  * `on-error-container`: `#410002`

### 3. Màu nền & Bề mặt (Background & Surface Colors)
* **Background (Nền ứng dụng):** `#fbfdf8`
  * `on-background` (Màu chữ chính): `#191d19`
* **Surface (Bề mặt thẻ/phần tử):** `#fbfdf8`
  * `on-surface`: `#191d19`
  * `surface-variant`: `#dee5da`
  * `on-surface-variant`: `#424940`
* **Surface Container (Các cấp độ lồng nhau):**
  * `surface-container-lowest`: `#ffffff`
  * `surface-container-low`: `#f1f4ef`
  * `surface-container`: `#f0f4f1`
  * `surface-container-high`: `#e8ebe8`
  * `surface-container-highest`: `#e2e3de`
* **Outline (Đường viền):** `#717971`
  * `outline-variant`: `#c1c9be`

---

## font-family & Typography (Kiểu chữ)

Hệ thống sử dụng hai phông chữ chính được cấu hình và import qua Google Fonts trong [layout.tsx](file:///Volumes/DATA/workspace/vietelite_questionbank/src/app/layout.tsx):

* **Font Tiêu đề (Headline Font):** `Manrope` (CSS Variable: `--font-manrope`)
  * Được gán thông qua `--font-headline` trong Tailwind.
* **Font Nội dung (Body/Label Font):** `Inter` (CSS Variable: `--font-inter`)
  * Được gán thông qua `--font-body` và `--font-label` trong Tailwind.

### Cấu hình Fonts mặc định:
* Toàn bộ phần `body` áp dụng phông chữ `font-body` (`Inter`) và màu chữ `text-on-background`.
* Các thẻ tiêu đề (`h1` đến `h6`) tự động áp dụng phông chữ `font-headline` (`Manrope`).
* Hệ thống biểu tượng sử dụng thư viện **Material Symbols Outlined** (được nhúng qua CDN link trong `<head>`).

---

## 📏 Bố cục & Khoảng cách (Spacing & Layout)

* **Thiết lập đơn vị cơ sở:** Sử dụng lưới cơ sở (Grid System) mặc định của Tailwind CSS (gốc 4px / 0.25rem).
* **Định dạng tài liệu A4 (In ấn & Web View):**
  * Hỗ trợ giao diện xem trước tài liệu chuẩn kích thước A4 trên trình duyệt thông qua class `.a4-page`:
    * Chiều rộng cố định: `210mm`
    * Chiều cao tối thiểu: `297mm`
    * Padding (Chế độ Web): Top `12mm`, Right `20mm`, Bottom `20mm`, Left `30mm` (Chừa lề trái để đóng gáy tài liệu).
    * Padding (Chế độ In): Top `25mm`, Right `15mm`, Bottom `25mm`, Left `30mm`.
    * Box-shadow nhẹ trên web và tự động ẩn shadow khi chuyển sang chế độ in hoặc xuất PDF.
  * Các class chuyên dụng cho in ấn: `.no-print` (ẩn header, sidebar), `.page-break` (ép buộc ngắt trang) và `.page-break-inside-avoid` (tránh ngắt trang nửa chừng đối với các câu hỏi phức tạp).

---

## 🧱 Phong cách thành phần (Component Styles)

### 1. Bo góc (Border Radius)
Hệ thống sử dụng ba mức bo góc chính được cấu hình trong `@theme`:
* `lg`: `0.5rem` (8px) - Dùng cho các nút (Buttons), hộp nhập liệu (Inputs).
* `xl`: `0.75rem` (12px) - Dùng cho các thẻ (Cards), hộp thoại nhỏ (Modals).
* `2xl`: `1rem` (16px) - Dùng cho các vùng chứa lớn hoặc Modal chính.

### 2. Hiệu ứng kính (Glassmorphism)
* **Class `.glass-panel`:**
  * Background: màu trắng mờ với độ đục 70% (`rgb(255 255 255 / 0.7)`)
  * Backdrop-filter: làm mờ nền sau `blur(24px)`
  * Border: viền trắng mờ mảnh `1px solid rgb(255 255 255 / 0.2)`
  * Shadow: bóng đổ mượt mà tích hợp sẵn.

### 3. Thanh cuộn tùy chỉnh (Custom Scrollbar)
* Sử dụng class `.custom-scrollbar` với độ rộng thanh cuộn mảnh `6px` và bo tròn góc `20px` màu xám mờ để đảm bảo giao diện gọn gàng, không bị thô.

### 4. Hiệu ứng Sidebar (Sidebar Transitions)
* Sidebar sử dụng hiệu ứng chuyển đổi mượt mà với cubic-bezier `transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
* Khi thu nhỏ, các tiêu đề `.nav-label` và `.sidebar-title` tự động ẩn, các item chuyển sang căn giữa (`justify-content: center`).

---

## 🧪 Tối ưu hóa hiển thị Công thức Toán học (KaTeX)
* Tích hợp CSS đặc thù cho công thức toán học hiển thị thông qua KaTeX `.katex-display` với cơ chế cuộn ngang thông minh (`overflow-x: auto`), tránh vỡ khung giao diện.
* Đặt phông chữ mặc định của công thức toán là `font-size: 1.1em` nâng cao độ trực quan và khả năng đọc.
