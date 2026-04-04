# 📂 Quản lý Bộ sưu tập & Ngân hàng Câu hỏi (Collection Management)

Tài liệu này mô tả chi tiết chức năng Quản lý Bộ sưu tập, một phần cốt lõi của ứng dụng giúp người dùng tổ chức và lưu trữ câu hỏi từ nhiều nguồn khác nhau.

## 🌟 Tổng quan (Overview)

Giao diện **Question Bank** được thiết kế theo cấu trúc **3 cột (Three-Column Layout)** hiện đại, cho phép người dùng thao tác kéo thả mượt mà:
1.  **📂 Danh sách Tệp (Fileshelf)**: Hiển thị các thư mục và tệp tài liệu nguồn.
2.  **📄 Nguồn Câu hỏi (Question Source)**: Hiển thị danh sách câu hỏi có trong tệp đã chọn.
3.  **🛒 Giỏ hàng (Selection Cart/Selection)**: Khu vực chứa các câu hỏi được chọn để tạo bộ sưu tập mới.

---

## 🛠️ Tính năng Kỹ thuật (Technical Features)

### 1. Kéo thả với @dnd-kit
- Sử dụng thư viện `@dnd-kit` để đảm bảo hiệu năng cao và hỗ trợ tốt cho thiết bị di động/cảm ứng.
- **Logic di chuyển**: Khi kéo một câu hỏi từ cột Nguồn sang cột Giỏ hàng, hệ thống sẽ tự động cập nhật trạng thái cục bộ và ẩn câu hỏi đó ở cột Nguồn để tránh trùng lặp.
- **Hỗ trợ Công thức (LaTeX)**: Các câu hỏi được hiển thị bằng `react-latex-next`, hỗ trợ đầy đủ các ký hiệu toán học và hóa học phức tạp.

### 2. Hệ thống Độ khó & Nhận diện Màu sắc
Hệ thống tự động phân loại và gán màu sắc nhận diện dựa trên dữ liệu từ Database:
- 🔴 **Khó (Hard)**: Nhận diện từ khóa `khó`, `hard`. Hiển thị viền màu Đỏ và Badge Đỏ rực rỡ.
- 🟡 **Trung bình (Medium)**: Nhận diện từ khóa `trung bình`, `vừa`, `medium`. Hiển thị viền màu Vàng và Badge Vàng.
- 🟢 **Dễ (Easy)**: Nhận diện từ khóa `dễ`, `easy`. Hiển thị viền màu Xanh lá và Badge Xanh.

### 3. Quy trình Tạo Bộ sưu tập (Save Workflow)
1.  **Chọn câu hỏi**: Người dùng kéo thả câu hỏi vào Giỏ hàng.
2.  **Lưu trữ**: Nhấn nút "Lưu Bộ sưu tập" để mở Modal nhập thông tin (Tên bộ sưu tập, mô tả).
3.  **Xử lý Backend (Server Actions)**:
    - Gọi hành động `createCollection` để lưu thông tin vào bảng `lms_collections`.
    - Liên kết các câu hỏi đã chọn vào bảng trung gian `lms_questions_collections`.
4.  **Success State**: Sau khi lưu thành công, Modal hiển thị màn hình xác nhận cho phép người dùng chuyển hướng sang trang quản lý Collections hoặc tiếp tục tạo bộ mới.
5.  **Clean up**: Hệ thống thực hiện `onReset` để làm trống Giỏ hàng sau khi lưu thành công.

---

## 🗄️ Cấu trúc Dữ liệu (Database Schema)

Chức năng này sử dụng mối quan hệ **N-N (Many-to-Many)** giữa Câu hỏi và Bộ sưu tập:

- **`lms_collections`**: Lưu thông tin cơ bản của bộ sưu tập (id, title, description, created_at, updated_at).
- **`lms_questions_collections`**: Bảng trung gian liên kết giữa `question_id` và `collection_id`.

---

## 🚀 Hướng dẫn Vận hành (Operational Guide)

### Cách tạo một bộ sưu tập mới:
1.  Truy cập vào màn hình **Question Bank**.
2.  Chọn tệp nguồn từ thư mục bên trái.
3.  **Kéo** các câu hỏi cần thiết từ danh sách giữa và **thả** vào khu vực "Giỏ hàng" bên phải.
4.  Nhấn nút **"Lưu Bộ sưu tập"** ở phía trên cột Giỏ hàng.
5.  Nhập tên bộ sưu tập và kiểm tra lại danh sách câu hỏi trong phần Preview.
6.  Nhấn **"Xác nhận Lưu"**.

---
*Tài liệu được cập nhật bởi eMon Agent.*
