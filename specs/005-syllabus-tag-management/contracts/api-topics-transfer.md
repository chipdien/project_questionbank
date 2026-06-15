# API Contract: Truy vấn Quan hệ & Chuyển đổi Chủ đề hàng loạt

## 1. GET /api/topics/[id]/related
Lấy thống kê các câu hỏi liên quan trực tiếp và gián tiếp (qua chủ đề con) cùng các chủ đề con khi người dùng muốn xóa một chủ đề.

### Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "topic_id": "3",
  "title": "Phân số",
  "subtopics_count": 2,
  "subtopics": [
    { "id": "4", "title": "Phép cộng phân số", "path": "/1/2/3/4/" },
    { "id": "5", "title": "Phép trừ phân số", "path": "/1/2/3/5/" }
  ],
  "questions_count": 5,
  "questions": [
    { "id": "101", "code": "Q00101", "statement": "Tính 1/2 + 1/3..." },
    { "id": "102", "code": "Q00102", "statement": "Tính 3/4 - 1/2..." }
  ]
}
```

---

## 2. POST /api/topics/[id]/transfer
Chuyển đổi hàng loạt toàn bộ câu hỏi đang liên kết với chủ đề hiện tại (và tùy chọn tất cả chủ đề con) sang một chủ đề đích mới.

### Request Body
```json
{
  "target_topic_id": "10",
  "include_subtopics": true
}
```
*Ghi chú: Nếu `include_subtopics` là `true`, toàn bộ câu hỏi liên kết với các chủ đề con cháu cũng sẽ được chuyển sang chủ đề đích.*

### Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "message": "Successfully transferred 5 questions to topic 10.",
  "transferred_questions_count": 5,
  "affected_question_ids": ["101", "102", "103", "104", "105"]
}
```
