# 🏷️ Phân loại câu hỏi bằng AI (AI Classification)

Tính năng này cho phép tự động gắn thẻ (Tag) cho toàn bộ câu hỏi trong một tài liệu (Document) thông qua AI Gemini 2.5 Flash.

---

## 🎯 Mục tiêu
- Tự động xác định **Khối lớp** (từ lớp 6 đến 12).
- Phân loại **Độ khó** (Dễ, Trung Bình, Khó).
- Ánh xạ câu hỏi vào **Bài học** (Lesson) phù hợp nhất có sẵn trong hệ thống.

---

## 🔄 Luồng hoạt động (Workflow)

1. **Trigger**: Người dùng nhấn nút "Phân loại bằng AI" trên giao diện quản lý câu hỏi.
2. **Data Fetching**: Hệ thống lấy danh sách toàn bộ câu hỏi thuộc Document đó cùng với danh sách bài học hiện có trong Database.
3. **AI Processing**: Gửi dữ liệu qua `QuestionClassifierService` để gọi Gemini API.
4. **Validation**: AI trả về kết quả theo cấu trúc JSON định sẵn (Schema Enforcement).
5. **Update**: Hệ thống cập nhật các bảng `lms_questions`, `lms_questions_lessons` và đánh dấu tài liệu là `is_ai_classified = 1`.

---

## 🧠 Chi tiết Prompt AI (AI Instruction)

Hệ thống sử dụng **System Instruction** để định hướng tư duy cho AI. Dưới đây là nội dung chi tiết:

### 1. Vai trò & Nhiệm vụ
> Bạn là một chuyên gia giáo dục xuất sắc. Nhiệm vụ của bạn là phân loại danh sách câu hỏi được cung cấp vào Khối lớp, Độ khó và Bài học phù hợp.

### 2. Ngữ cảnh (Context)
Hệ thống cung cấp cho AI hai danh sách: 
- Danh sách Bài học: `ID` và `Tên bài học`.
- Danh sách Câu hỏi: `ID` và `Nội dung`.

### 3. Quy tắc phân loại
- **Khối lớp**: Chỉ chọn từ 6 đến 12 dưới dạng số chuỗi.
- **Độ khó**: Chỉ chọn một trong ba mức: `Dễ`, `Trung Bình`, `Khó`.
- **Bài học**: 
    - Phải tìm bài học có nội dung sát nhất.
    - Trả về `ID` của bài học đó.
    - Nếu hoàn toàn không có bài học liên quan, trả về `null`.
    - **TUYỆT ĐỐI** không tự tạo ra ID bài học mới.

### 4. Kiểm soát đầu ra (Output Control)
- Sử dụng **JSON Strict Mode** (Gemini 2.5) để đảm bảo kết quả luôn là JSON hợp lệ.
- Không có văn bản giải thích dư thừa, chỉ chứa mảng `classifications`.

---

## 📊 Cấu trúc Dữ liệu (Schema)

AI luôn trả về dữ liệu tuân thủ Schema sau:

```json
{
  "classifications": [
    {
      "question_id": number,
      "grade": "6" | "7" | ... | "12",
      "difficulty": "Dễ" | "Trung Bình" | "Khó",
      "lesson_id": number | null
    }
  ]
}
```

---

## 🛡️ Cơ chế "Phân loại một lần" (Classify Once)
Để tối ưu chi phí API và tránh ghi đè dữ liệu thủ công, hệ thống sử dụng flag `is_ai_classified` trong bảng `lms_documents`. 
- Khi flag này là `1`, nút phân loại trên UI sẽ bị vô hiệu hóa.
- Tuy nhiên, người dùng vẫn có thể chỉnh sửa thủ công từng câu hỏi sau khi AI đã phân loại xong.

---
*Truy cập `docs/db/schema_history.md` để xem thay đổi cấu trúc bảng.*
