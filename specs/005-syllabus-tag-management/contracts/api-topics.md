# API Contract: Quản lý Chủ đề (Topics API)

## 1. GET /api/topics
Lấy toàn bộ cây danh mục chủ đề học thuật dưới dạng phẳng hoặc cấu trúc phân cấp.

### Response
- **Status Code**: `200 OK`
- **Body** (Array of topics):
```json
[
  {
    "id": "1",
    "title": "Toán lớp 5",
    "code": "MATH5",
    "content": "Chương trình toán lớp 5",
    "parent_id": null,
    "path": "/1/",
    "order_index": "1",
    "type": "SYLLABUS",
    "created_at": "2026-06-15T12:00:00.000Z",
    "updated_at": "2026-06-15T12:00:00.000Z"
  },
  {
    "id": "2",
    "title": "Số học",
    "code": "MATH5-NUM",
    "content": "Chuyên đề số học",
    "parent_id": "1",
    "path": "/1/2/",
    "order_index": "1",
    "type": "TOPIC"
  }
]
```

---

## 2. POST /api/topics
Tạo mới một chủ đề.

### Request Body
```json
{
  "title": "Phân số",
  "code": "MATH5-NUM-FRAC",
  "content": "Bài học về phân số",
  "parent_id": "2",
  "type": "LESSON",
  "subject_id": "1",
  "syllabus_id": "1"
}
```

### Response
- **Status Code**: `201 Created`
- **Body**:
```json
{
  "id": "3",
  "title": "Phân số",
  "code": "MATH5-NUM-FRAC",
  "content": "Bài học về phân số",
  "parent_id": "2",
  "path": "/1/2/3/",
  "type": "LESSON",
  "order_index": "1"
}
```

---

## 3. PATCH /api/topics/[id]
Cập nhật thông tin chủ đề hoặc di chuyển vị trí trong cây.

### Request Body
```json
{
  "title": "Phân số nâng cao",
  "parent_id": "4"
}
```

### Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "id": "3",
  "title": "Phân số nâng cao",
  "code": "MATH5-NUM-FRAC",
  "parent_id": "4",
  "path": "/1/4/3/"
}
```

---

## 4. DELETE /api/topics/[id]
Xóa một chủ đề.

### Xử lý chặn xóa (Option A)
Nếu chủ đề có chứa các chủ đề con hoặc có câu hỏi liên kết, API sẽ trả về lỗi `400 Bad Request` và không thực hiện xóa.

### Response (Khi có liên kết - Lỗi)
- **Status Code**: `400 Bad Request`
- **Body**:
```json
{
  "error": "Cannot delete topic. It contains subtopics or has linked questions.",
  "code": "RESTRICT_DELETE",
  "details": {
    "subtopics_count": 2,
    "questions_count": 15
  }
}
```

### Response (Thành công khi không có liên kết)
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "message": "Topic deleted successfully",
  "deleted": {
    "id": "3",
    "title": "Phân số nâng cao"
  }
}
```
