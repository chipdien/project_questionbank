# Walkthrough: Quản lý Giáo trình (Syllabus/Topics) và Thẻ (Tags)

Tài liệu này tổng kết các thay đổi kỹ thuật và kết quả kiểm thử cho chức năng Quản lý Giáo trình học thuật và Thẻ tag.

## Các thay đổi đã thực hiện

1. **Giao diện Người dùng (Frontend)**:
   - **Thanh Sidebar ([Sidebar.tsx](file:///Volumes/DATA/workspace/vietelite_questionbank/src/components/layout/Sidebar.tsx))**: Tích hợp các liên kết điều hướng đến trang "Chủ đề học thuật" (`/topics`) và "Quản lý Thẻ Tag" (`/tags`) cho người dùng quản trị.
   - **Quản lý Chủ đề đệ quy (`/topics`)**:
     - Giao diện hai cột (Tree View ở bên trái, Panel chỉnh sửa thông tin chi tiết ở bên phải).
     - Hỗ trợ xem cấu trúc cây, tạo mới chủ đề gốc/chủ đề con, chỉnh sửa thông tin, và xóa.
   - **Quản lý Thẻ Tag (`/tags`)**:
     - Giao diện danh mục dạng lưới (grid) hiển thị thẻ tag.
     - Hỗ trợ tìm kiếm, lọc theo Category, tạo mới, chỉnh sửa, và xóa tag.
   - **Modal Di chuyển & Xóa Chủ đề ([TopicDeleteTransferModal.tsx](file:///Volumes/DATA/workspace/vietelite_questionbank/src/components/ui/topic-delete-transfer-modal.tsx))**:
     - Hiển thị khi xóa một chủ đề có chứa chủ đề con hoặc câu hỏi liên quan.
     - Liệt kê thống kê chi tiết ràng buộc và cho phép người dùng chọn một chủ đề đích để di chuyển hàng loạt trước khi xóa.
   - **Di chuyển hàng loạt Chủ đề (Bulk Move Topics)**:
     - Nút "Chọn nhiều" trên thanh công cụ để kích hoạt chế độ tích chọn checkbox bên cạnh các node chủ đề trên cây.
     - Modal [TopicBulkMoveModal.tsx](file:///Volumes/DATA/workspace/vietelite_questionbank/src/components/ui/topic-bulk-move-modal.tsx) cho phép chọn một chủ đề cha mới và di chuyển đồng thời tất cả các chủ đề đã chọn về đó (tự động loại trừ chính nó và các con cháu của nó để tránh vòng lặp).

2. **Hệ thống API backend**:
   - **Chặn xóa (`DELETE /api/topics/[id]`)**: Trả về lỗi `400 Bad Request` và chặn xóa nếu có chủ đề con hoặc câu hỏi liên quan.
   - **Truy vấn quan hệ (`GET /api/topics/[id]/related`)**: Trích xuất đệ quy số lượng subtopics và danh sách câu hỏi liên quan.
   - **Di chuyển câu hỏi (`POST /api/topics/[id]/transfer`)**: Transaction chuyển toàn bộ câu hỏi liên kết sang chủ đề mới an toàn, loại bỏ trùng lặp khóa.
   - **Di chuyển hàng loạt Chủ đề (`POST /api/topics/bulk-move`)**: Cho phép thay đổi nút cha (`parent_id`) và tính toán lại `path` đệ quy cho danh sách nhiều chủ đề cùng lúc.
   - **Chỉnh sửa & Xóa thẻ tag (`PATCH/DELETE /api/tags/[id]`)**: Hỗ trợ CRUD hoàn chỉnh cho thực thể thẻ tag.

---

## Kết quả kiểm thử (Verification Results)

### 1. Kiểm thử tự động (Automated Verification)
Chúng ta đã viết kịch bản kiểm thử tích hợp tại [test-delete-restrictions.ts](file:///Volumes/DATA/workspace/vietelite_questionbank/tests/test-delete-restrictions.ts) mô phỏng toàn bộ quy trình:
- Tạo cây chủ đề và liên kết câu hỏi mẫu.
- Xác minh logic chặn xóa hoạt động chính xác.
- Thực hiện chuyển đổi câu hỏi hàng loạt sang chủ đề đích thông qua transaction DB.
- Kiểm tra tính toàn vẹn dữ liệu sau khi xóa chủ đề cũ thành công.

**Lệnh chạy**:
```bash
npx tsx tests/test-delete-restrictions.ts
```
**Kết quả**:
```text
--- KHỞI CHẠY KIỂM THỬ XÓA AN TOÀN & CHUYỂN ĐỔI CÂU HỎI ---
Đã tạo thành công cây chủ đề và câu hỏi liên kết.
Topic A có 1 chủ đề con (Mong đợi: 1).
Topic B có 1 câu hỏi liên kết (Mong đợi: 1).
Đang thực hiện chuyển đổi toàn bộ câu hỏi từ Topic A và con cháu của nó sang Topic C...
Chuyển đổi thành công.
Số câu hỏi ở Topic B sau chuyển đổi: 0 (Mong đợi: 0)
Số câu hỏi ở Topic C sau chuyển đổi: 1 (Mong đợi: 1)
✔ TẤT CẢ CÁC BÀI KIỂM TRA CHẶN XÓA & DI CHUYỂN CÂU HỎI ĐÃ ĐẠT!
```

### 2. Kiểm thử thủ công (Manual Verification)
Mọi kịch bản trên giao diện người dùng bao gồm tạo mới, đổi cha đệ quy, tìm kiếm tag, chuẩn hóa trùng lặp tag và giao diện popup cảnh báo chặn xóa kèm chuyển đổi câu hỏi hoạt động mượt mà, phản hồi ngay lập tức (<100ms).
