# API Contract: Quản lý Thẻ Tag (Tags API)

## 1. GET /api/tags
Lấy danh sách các thẻ tag trong hệ thống. Hỗ trợ tìm kiếm và lọc theo category.

### Query Parameters
- `q` (optional): Từ khóa tìm kiếm theo tên tag.
- `category` (optional): Lọc theo nhóm category (ví dụ: `SOURCE`, `METHOD`, `SKILL`).

### Response
- **Status Code**: `200 OK`
- **Body** (Array of tags):
```json
[
  {
    "id": "1",
    "name": "Toán tư duy",
    "category": "SKILL",
    "created_at": "2026-06-15T12:00:00.000Z",
    "updated_at": "2026-06-15T12:00:00.000Z"
  },
  {
    "id": "2",
    "name": "Chuyên Sư Phạm 2026",
    "category": "SOURCE"
  }
]
```

---

## 2. POST /api/tags
Tạo mới một thẻ tag.

### Request Body
```json
{
  "name": "Toán tư duy",
  "category": "SKILL"
}
```

### Response (Thành công)
- **Status Code**: `201 Created`
- **Body**:
```json
{
  "id": "3",
  "name": "Toán tư duy",
  "category": "SKILL"
}
```

### Response (Trùng tên tag - Lỗi)
- **Status Code**: `400 Bad Request`
- **Body**:
```json
{
  "error": "Tag name already exists."
}
```

---

## 3. PATCH /api/tags/[id]
Cập nhật thông tin thẻ tag.

### Request Body
```json
{
  "name": "Toán tư duy nâng cao",
  "category": "SKILL"
}
```

### Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "id": "3",
  "name": "Toán tư duy nâng cao",
  "category": "SKILL"
}
```

---

## 4. DELETE /api/tags/[id]
Xóa một thẻ tag. Hệ thống sẽ tự động gỡ liên kết của tag này khỏi toàn bộ câu hỏi liên quan mà không xóa câu hỏi.

### Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "message": "Tag deleted successfully and unlinked from 12 questions.",
  "deleted": {
    "id": "3",
    "name": "Toán tư duy nâng cao"
  }
}
```
