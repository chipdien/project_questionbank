# 💻 Cài đặt môi trường phát triển (Setup)

Hướng dẫn cấu hình môi trường phát triển cục bộ và khởi chạy dự án.

---

## ⚙️ Yêu cầu hệ thống (Requirements)

- **Node.js**: Phiên bản 18.x hoặc 20.x (Khuyên dùng bản LTS).
- **MySQL**: Một instance MySQL đang chạy (cục bộ hoặc từ xa).
- **Trình quản lý gói**: `npm` (mặc định đi kèm theo Node.js).

---

## 🛠️ Quy trình cài đặt (Installation)

1.  **Sao chép kho lưu trữ (Clone the Repository)**:
    ```bash
    git clone https://github.com/chipdien/project_questionbank.git
    cd project_questionbank
    ```

2.  **Cài đặt các thư viện phụ thuộc (Install Dependencies)**:
    ```bash
    npm install
    ```

3.  **Cấu hình biến môi trường (`.env`)**:
    Tạo file `.env` từ file ví dụ:
    ```bash
    cp .env.example .env
    ```
    Sau đó, điền đầy đủ các thông tin xác thực cho MySQL, Google Gemini và Mathpix API.

---

## 🏃 Khởi chạy ứng dụng (Running the App)

- **Chế độ phát triển (Development Mode)**:
  ```bash
  npm run dev
  ```
- **Xây dựng bản production (Build)**:
  ```bash
  npm run build
  ```
- **Kiểm tra mã nguồn (Linting Code)**:
  ```bash
  npm run lint
  ```

---

## 🧪 Kiểm tra kết nối (Testing Connection)

Đảm bảo máy chủ MySQL đã hoạt động. Bạn có thể chạy script kiểm tra:
```bash
node check_schema.js
```

---
*Truy cập `docs/development/coding-standard.md` để xem quy chuẩn lập trình.*
