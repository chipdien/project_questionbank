# HƯỚNG DẪN & BÁO CÁO KHẮC PHỤC LỖI HIỂN THỊ CÂU HỎI LỚP 5
> **Dự án**: VietElite Question Bank  
> **Trạng thái**: Đã khắc phục & Kiểm tra thành công  
> **Người thực hiện**: eMon (AI Agent)

---

## 📋 1. Tổng quan Sự cố (Issue Overview)

Khi người dùng truy cập màn hình **Question Bank (Ngân hàng câu hỏi)** hoặc **Trang chủ** và chọn bộ lọc **Khối 5**, danh sách câu hỏi trả về hiển thị các giá trị lỗi như `"---"` ở cột lớp/chủ đề và `"N/A"` ở cột nội dung câu hỏi thay vì nội dung thực tế.

---

## 🔍 2. Phân tích Nguyên nhân gốc rễ (Root Cause Analysis)

Qua điều tra trực tiếp cấu trúc bảng `lms_questions` trong cơ sở dữ liệu MySQL, chúng tôi phát hiện 2 vấn đề lớn về mặt dữ liệu và hiển thị:

1. **Phân bổ nội dung câu hỏi không đồng nhất**:
   - Trong tổng số 9,439 câu hỏi của lớp 5, có tới **6,985 câu hỏi** có giá trị ở trường `statement` là chuỗi ký tự `'1'`. Trường `content` của các bản ghi này mới là nơi lưu trữ nội dung câu hỏi thực tế.
   - Khoảng **217 câu hỏi** lớp 5 có trường `statement` là `NULL` hoặc rỗng `''`.
   - Với các câu hỏi trắc nghiệm tiếng Anh, `statement` chỉ lưu phần đề bài chung (Ví dụ: *"Choose the best answer..."*), còn nội dung câu hỏi thực tế cần điền/trả lời lại nằm ở trường `content`.
   
2. **Logic hiển thị của Frontend**:
   - Trước đây, hệ thống chỉ lấy và hiển thị trường `statement` thông qua hàm `cleanMathpixData(q.statement)`.
   - Vì thế, 76% câu hỏi lớp 5 bị hiển thị thành `"1"` (bị Markdown ẩn hoặc hiển thị số 1) hoặc `"N/A"`. Hơn nữa, các câu hỏi tiếng Anh bị mất nội dung chi tiết.

---

## 🛠️ 3. Giải pháp Khắc phục (Applied Solutions)

Chúng tôi đã triển khai giải pháp kết hợp hiển thị thông minh giữa `statement` và `content` để xử lý triệt để tất cả các trường hợp dữ liệu:

### A. Thêm Hàm Xử Lý Thông Minh
Hàm `getQuestionDisplayContent` được thêm vào tệp tin [math-utils.ts](file:///d:/VietElite/project_questionbank/src/lib/utils/math-utils.ts):
```typescript
export const getQuestionDisplayContent = (
  statement: string | null | undefined,
  content: string | null | undefined
): string => {
  const cleanStmt = statement?.trim() || '';
  const cleanContent = content?.trim() || '';

  // Trường hợp statement là rác ("1") hoặc rỗng -> lấy content
  if (!cleanStmt || cleanStmt === '1') {
    return cleanContent;
  }

  // Trường hợp content rỗng hoặc chỉ chứa dấu chấm "." -> lấy statement
  if (!cleanContent || cleanContent === '.') {
    return cleanStmt;
  }

  // Nếu cả hai cột giống nhau -> lấy một cột
  if (cleanStmt === cleanContent) {
    return cleanStmt;
  }

  // Trường hợp cả hai đều có giá trị khác nhau -> ghép lại để hiển thị đầy đủ
  return `${cleanStmt}\n\n${cleanContent}`;
};
```

### B. Cập nhật Interface & API Query
- Cập nhật thêm thuộc tính `content` vào định nghĩa kiểu `Question` tại:
  - [types/index.ts](file:///d:/VietElite/project_questionbank/src/types/index.ts)
  - [useQuestionBank.ts](file:///d:/VietElite/project_questionbank/src/app/(main)/question-bank/hooks/useQuestionBank.ts)
- Sửa đổi các câu lệnh SQL ở trang chủ [page.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/page.tsx) để select thêm trường `content`.

### C. Cập nhật Giao diện hiển thị (UI Components)
Áp dụng render nội dung thông qua hàm helper mới tại:
1. **Bảng danh sách câu hỏi**: [QuestionsDataGrid.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-bank/components/QuestionsDataGrid.tsx)
2. **Khung câu hỏi nguồn**: [QuestionBankManager.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-bank/components/QuestionBankManager.tsx)
3. **Modal chi tiết câu hỏi**: [QuestionModal.tsx](file:///d:/VietElite/project_questionbank/src/app/(main)/question-bank/components/QuestionModal.tsx)

---

## 📈 4. Phương án Phòng ngừa & Khuyến nghị (Prevention & Best Practices)

- **Khi Import dữ liệu**: Trong các script migration/import câu hỏi sau này, cần chuẩn hóa để đưa câu hỏi vào trường `statement` làm trường chính, tránh sử dụng giá trị `'1'` làm placeholder.
- **Khi viết UI mới**: Bất cứ khi nào hiển thị nội dung câu hỏi từ bảng `lms_questions`, luôn sử dụng helper `getQuestionDisplayContent(q.statement, q.content)` thay vì chỉ sử dụng `q.statement`.
