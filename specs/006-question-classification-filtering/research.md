# Research: Bộ Tiêu chí Phân loại và Bộ lọc Ngân hàng Câu hỏi

## 1. Nghiên cứu truy vấn đệ quy theo chủ đề học thuật (lms_topics)

### Vấn đề:
Khi người dùng chọn một chủ đề trong cây chủ đề, làm sao để lấy tất cả câu hỏi thuộc về chủ đề đó và toàn bộ chủ đề con cháu?

### Giải pháp:
Sử dụng trường `path` (materialized path) của bảng `lms_topics`.
Ví dụ: Nút cha có ID 5, path `/1/5/`. Tất cả các nút con cháu của nó sẽ có path bắt đầu bằng `/1/5/`.
Truy vấn trong Prisma:
1. Lấy thông tin chủ đề được chọn:
```typescript
const topic = await prisma.lms_topics.findUnique({
  where: { id: BigInt(topicId) },
  select: { path: true }
});
```
2. Tìm tất cả ID của chủ đề con cháu:
```typescript
const childTopics = await prisma.lms_topics.findMany({
  where: {
    path: {
      startsWith: topic.path
    }
  },
  select: { id: true }
});
const topicIds = childTopics.map(t => t.id);
```
3. Lọc câu hỏi có liên kết với bất kỳ chủ đề nào trong danh sách `topicIds` thông qua bảng liên kết `lms_topics_questions`:
```typescript
whereClause.topics = {
  some: {
    topic_id: { in: topicIds }
  }
};
```

---

## 2. Lọc theo nhiều Thẻ Tag (lms_tags) cùng lúc

### Vấn đề:
Khi người dùng chọn lọc theo nhiều tag, hệ thống nên lọc theo kiểu giao (AND - câu hỏi chứa tất cả tag đã chọn) hay kiểu hợp (OR - câu hỏi chứa ít nhất một trong các tag đã chọn)?

### Quyết định:
- **Lọc theo hợp (OR) trong cùng một danh mục (Category) và giao (AND) giữa các danh mục khác nhau**: Đây là chuẩn UX/UI tìm kiếm nâng cao thương mại điện tử/ngân hàng câu hỏi.
- Để đơn giản và chính xác nhất cho nghiệp vụ kiểm tra kiến thức:
  - Nếu người dùng chọn lọc nhiều tag: Lọc theo **AND** (câu hỏi phải khớp tất cả các thẻ tag được chọn) hoặc **OR** tùy cấu hình. Trong phạm vi MVP này, chúng ta sẽ áp dụng **OR** cho các tag cùng category và **AND** giữa các category, hoặc lọc giao diện linh hoạt. 
  - Đơn giản nhất: Lọc **OR** giữa tất cả các tag được chọn (câu hỏi chứa ít nhất một trong các tag) để mở rộng kết quả, hoặc lọc **AND** để thu hẹp. Chúng tôi chọn giải pháp: hỗ trợ cả hai, mặc định là **OR** đối với danh sách tag để dễ tìm kiếm, hoặc lọc theo kiểu:
  ```typescript
  whereClause.tags = {
    some: {
      tag_id: { in: tagIds.map(BigInt) }
    }
  };
  ```

---

## 3. Đồng bộ hóa bộ lọc lên URL

### Quyết định:
Sử dụng `useSearchParams`, `usePathname`, và `useRouter` từ `next/navigation` để đồng bộ state bộ lọc. Khi thay đổi bộ lọc, đẩy các giá trị lên URL query string. Khi load trang, đọc các giá trị từ URL để khởi tạo state.
Các query params tương ứng:
- `grade`: Khối lớp (ví dụ: `10`)
- `difficulty`: Độ khó (ví dụ: `Thông hiểu`)
- `topicId`: ID của chủ đề học thuật
- `tagIds`: Danh sách tag ID cách nhau bởi dấu phẩy (ví dụ: `1,2,3`)
- `q`: Từ khóa tìm kiếm toàn văn
