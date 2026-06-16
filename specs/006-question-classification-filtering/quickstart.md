# Quickstart: Bộ Tiêu chí Phân loại và Bộ lọc Ngân hàng Câu hỏi

Hướng dẫn chạy thử và xác thực tính năng lọc và phân loại câu hỏi nâng cao.

## 1. Chuẩn bị dữ liệu mẫu (Prerequisites)

Hãy đảm bảo bạn đã chạy dev server:
```bash
npm run dev
```

Và cơ sở dữ liệu đã có một số câu hỏi được phân loại khối lớp, độ khó, có liên kết với chủ đề và tag. Bạn có thể sử dụng giao diện quản lý chủ đề và quản lý thẻ tag để thiết lập dữ liệu ban đầu.

## 2. Xác thực bằng giao diện (Manual Verification Steps)

1. Truy cập trang **Ngân hàng câu hỏi** tại địa chỉ: `http://localhost:3000/question-bank`.
2. Kiểm tra phần **BỘ LỌC CÂU HỎI** ở cột bên trái:
   - Chọn **Khối lớp** (ví dụ: Khối 10).
   - Chọn **Độ khó** (ví dụ: Thông hiểu).
   - Chọn **Chủ đề** (ví dụ: một chủ đề cấp 1).
   - Chọn một hoặc nhiều **Thẻ tag** trong danh mục thẻ.
3. Quan sát cột **CÂU HỎI TÌM ĐƯỢC**:
   - Danh sách câu hỏi phải tải lại ngay lập tức và chỉ hiển thị các câu hỏi khớp chính xác với toàn bộ tiêu chí lọc đã chọn.
   - Nhấp đúp vào câu hỏi để thêm vào **CÂU HỎI ĐÃ CHỌN**.
4. Kiểm tra đệ quy chủ đề:
   - Chọn một chủ đề cha. Đảm bảo toàn bộ câu hỏi thuộc các chủ đề con và con cháu của nó cũng được hiển thị trong kết quả tìm kiếm.
5. Kiểm tra đồng bộ URL:
   - Khi chọn các bộ lọc, kiểm tra xem thanh địa chỉ trình duyệt có tự động cập nhật query parameters dạng: `?grade=10&difficulty=Thông+hiểu&topicId=5...` hay không.
   - Sao chép URL này và mở ở một tab mới. Kiểm tra xem bộ lọc có tự động khôi phục đúng trạng thái ban đầu và danh sách câu hỏi có tải đúng hay không.
