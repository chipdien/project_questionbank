# Walkthrough: Topic Taxonomy & Tagging Upgrade

Chúng ta đã thực hiện thành công việc nâng cấp hệ thống phân loại chủ đề sang cấu trúc đệ quy (Materialized Path) và tích hợp hệ thống gắn thẻ tag cho ngân hàng câu hỏi VietElite.

## Các thay đổi đã thực hiện

1. **Database Schema (Prisma ORM)**:
   - Nâng cấp bảng `lms_topics` để hỗ trợ quan hệ tự liên kết (`parent_id`) và trường materialized path (`path`), cùng trường phân cấp nghiệp vụ `type`.
   - Tạo bảng thẻ tag `lms_tags` và bảng map Nhiều-Nhiều trung gian `lms_questions_tags` để gán nhãn đa chiều cho câu hỏi.
   - Chuyển `relationMode = "prisma"` để quản lý khóa ngoại thông qua Prisma Client, giúp tránh các lỗi vi phạm ràng buộc dữ liệu mồ côi lịch sử.
   - Thêm index trên các cột `path` và `parent_id` của `lms_topics` giúp tối ưu tốc độ truy vấn.
2. **Helper Logic (`src/lib/materialized-path.ts`)**:
   - Cung cấp hàm tự động tính toán sinh path từ root đến node hiện tại.
   - Cập nhật đệ quy toàn bộ con cháu của một node khi node cha thay đổi (dịch chuyển cây).
3. **Các API Endpoints**:
   - `src/app/api/topics/route.ts` & `[id]/route.ts`: API CRUD cho cây đệ quy.
   - `src/app/api/tags/route.ts` & `src/app/api/questions/[id]/tags/route.ts`: API quản lý tag và gán tag cho câu hỏi.
   - `src/app/api/questions/search/route.ts`: API lọc tìm kiếm nâng cao kết hợp giữa chủ đề đệ quy và các thẻ tag.
4. **Di chuyển dữ liệu cũ (`src/scripts/migrate-old-data.ts`)**:
   - Chuyển đổi thành công 66 Syllabuses cũ, cấu trúc lại 1,512 Topics và map 12 Lessons cũ sang cấu trúc đệ quy mới mà không làm mất mát liên kết câu hỏi nào.

## Kết quả kiểm thử (Validation Results)

Chúng ta đã xây dựng và chạy 4 kịch bản kiểm thử tự động trong thư mục `tests/`:
* `test-prisma.ts`: Xác nhận kết nối DB qua Prisma.
* `test-taxonomy.ts`: Tạo, di chuyển node đệ quy và cập nhật path tự động ➔ **ĐẠT (PASS)**.
* `test-tagging.ts`: Tạo tag, gán vào câu hỏi và truy vấn theo tag name ➔ **ĐẠT (PASS)**.
* `test-search-performance.ts`: Lọc câu hỏi theo chủ đề đệ quy + tag ➔ **ĐẠT (PASS)**, thời gian phản hồi chỉ tốn **24ms - 48ms** cực kỳ tối ưu.
