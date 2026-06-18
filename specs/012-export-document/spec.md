# Feature Specification: Thống kê Số lần Sử dụng Câu hỏi trong Đề xuất (Export Document Question Links & Statistics)

**Feature Branch**: `012-export-document`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "tôi muốn nâng cấp chức năng export document hiện tại, khi export thì tài liệu phải được link với câu hỏi trong file đó, nhằm mục đích tôi có thể thống kê được các câu hỏi nào đang được sử dụng bao nhiêu lần. Thêm thống kê cả ở bảng danh sách câu hỏi, chi tiết modal câu hỏi và hiển thị badge ở màn hình document để giáo viên chọn với nhãn 'đã dùng ...'."

---

## Tổng quan

Để quản lý và đánh giá chất lượng kho câu hỏi, hệ thống cần thống kê tần suất sử dụng của từng câu hỏi trong các đề/tài liệu tự soạn (Custom Documents) đã được xuất ra định dạng PDF.

Tính năng này thực hiện:
1. Thêm trường `export_count` lưu trữ trực tiếp trên bảng `lms_questions` (Denormalization).
2. Xây dựng script cập nhật dữ liệu quá khứ một lần từ bảng liên kết `lms_documents_custom_questions` vào trường `export_count`.
3. Cập nhật API xuất/lưu tài liệu để tự động tăng số lần sử dụng c�    - **Thư viện chọn câu hỏi trong Document Builder** (`QuestionLibrary.tsx`): hiển thị badge **"đã dùng X"** trên từng thẻ câu hỏi.
5. Cập nhật cấu hình Header của đề xuất trong Document Builder: cho phép người dùng thay đổi nhãn tiêu đề (mặc định là `"TÀI LIỆU HỌC TẬP"`).
6. Phân quyền và hiển thị danh sách lịch sử tài liệu:
   - Giáo viên (non-admin) chỉ xem được danh sách tài liệu do chính mình export.
   - Quản trị viên (admin) xem được toàn bộ tài liệu và hiển thị thêm badge thông tin người đã export đề xuất.

---

## User Scenarios & Testing

### User Story 1 - Xem số lần đã dùng của câu hỏi trên bảng danh sách câu hỏi
Là giáo viên hoặc admin, tôi muốn xem nhanh tần suất sử dụng của các câu hỏi trên bảng để biết câu hỏi nào đang được dùng nhiều hay ít.

*   **Acceptance Scenarios**:
    1. **Given** người dùng truy cập trang danh sách câu hỏi (`/question-list`), **When** danh sách được tải, **Then** bảng hiển thị cột **"Lượt dùng"** hiển thị số lần đã dùng tương ứng của từng câu hỏi.
    2. **Given** câu hỏi chưa từng được xuất trong đề nào, **When** tải bảng, **Then** cột "Lượt dùng" hiển thị giá trị `0`.

---

### User Story 2 - Xem chi tiết số lần dùng trong Modal câu hỏi
Là giáo viên hoặc admin, tôi muốn xem chi tiết thông số sử dụng khi mở xem chi tiết câu hỏi.

*   **Acceptance Scenarios**:
    1. **Given** người dùng click vào một câu hỏi ở bảng danh sách, **When** Modal chi tiết câu hỏi hiển thị, **Then** ở khu vực tiêu đề/thông tin cơ bản hiển thị badge **"Đã dùng: X lần"**.

---

### User Story 3 - Lựa chọn câu hỏi thông minh khi soạn đề (Document Builder)
Là giáo viên đang soạn đề, tôi muốn nhìn thấy số lượt dùng của câu hỏi trong danh sách lựa chọn bên phải để tránh chọn trùng lặp các câu hỏi đã xuất quá nhiều lần trước đó.

*   **Acceptance Scenarios**:
    1. **Given** giáo viên đang ở màn hình soạn tài liệu (`/documents`), **When** mở Thư viện bộ sưu tập câu hỏi ở thanh bên phải, **Then** trên mỗi thẻ câu hỏi hiển thị một badge nhỏ màu sắc hài hòa với nội dung **"đã dùng X"** (với X là số lần đã xuất).

---

### User Story 4 - Tự động cập nhật số lần dùng sau khi xuất đề thành công
Là giáo viên, khi tôi hoàn thành biên soạn và bấm xuất đề PDF thành công, số lần dùng của các câu hỏi trong đề đó phải tự động tăng thêm 1.

*   **Acceptance Scenarios**:
    1. **Given** giáo viên đã soạn xong một đề chứa các câu hỏi $Q_1, Q_2$, **When** bấm Export PDF và hệ thống lưu thành công tài liệu custom, **Then** giá trị `export_count` của các câu hỏi $Q_1, Q_2$ trong database tự động tăng lên 1, đồng thời cập nhật tức thì trên giao diện của các lần tải trang tiếp theo.

---

### User Story 5 - Thay đổi tiêu đề xuất bản (docType) của đề xuất
Là giáo viên hoặc admin, tôi muốn thay đổi dòng chữ tiêu đề "TÀI LIỆU HỌC TẬP" mặc định trong file PDF xuất bản thành tiêu đề khác (ví dụ: "ĐỀ KHẢO SÁT").

*   **Acceptance Scenarios**:
    1. **Given** giáo viên đang mở Cấu hình Header trong Document Builder, **When** thay đổi ô nhập "Loại tài liệu" thành "ĐỀ KHẢO SÁT" và bấm Lưu, **Then** tiêu đề hiển thị ở đầu trang soạn thảo và trong file PDF được tải về sẽ tự động chuyển thành "ĐỀ KHẢO SÁT" viết hoa.

---

### User Story 6 - Phân quyền và giám sát lịch sử xuất tài liệu
Là giáo viên, tôi chỉ muốn thấy danh sách tài liệu do chính mình tạo ra. Là admin, tôi muốn xem toàn bộ và biết ai đã export tài liệu đó.

*   **Acceptance Scenarios**:
    1. **Given** giáo viên (non-admin) chuyển sang tab Lịch sử tài liệu ở sidebar, **When** danh sách tải, **Then** chỉ hiển thị các đề xuất do giáo viên đó tạo.
    2. **Given** quản trị viên (admin) chuyển sang tab Lịch sử tài liệu, **When** danh sách tải, **Then** hiển thị toàn bộ tài liệu kèm badge **"Bởi: <Tên người export>"** màu sắc phân biệt rõ ràng.

---

## Requirements

### 1. Database Schema Changes (Prisma)
- **FR-DB-001**: Thêm trường `export_count` vào model `lms_questions` trong file [schema.prisma](file:///d:/VietElite/project_questionbank/prisma/schema.prisma):
  ```prisma
  model lms_questions {
    // ...
    export_count Int @default(0)
    // ...
  }
  ```
- **FR-DB-002**: Chạy prisma migration để cập nhật database thực tế.
- **FR-DB-003**: Tạo một script chạy một lần (One-time Script) để đồng bộ số liệu cũ từ bảng `lms_documents_custom_questions` vào cột `export_count` cho toàn bộ các câu hỏi hiện tại.

### 2. Backend API Changes
- **FR-BE-001**: Cập nhật API [route.ts](file:///d:/VietElite/project_questionbank/src/app/api/documentcustom/upload-and-save/route.ts) tại endpoint `/api/documentcustom/upload-and-save`:
  Trong transaction, sau khi tạo thành công các bản ghi liên kết trong bảng `lms_documents_custom_questions`, thực hiện cập nhật tăng giá trị `export_count` cho danh sách câu hỏi:
  ```typescript
  await tx.$executeRawUnsafe(
    `UPDATE lms_questions SET export_count = export_count + 1 WHERE id IN (${questionIds.map(Number).join(',')})`
  );
  ```
- **FR-BE-002**: Đảm bảo trường `export_count` được trả về đầy đủ trong tất cả các API/Server Actions truy vấn câu hỏi bao gồm:
  - `fetchLibraryQuestions` (`src/lib/services/question.service.ts`)
  - `fetchQuestionsByDocId` (`src/lib/services/question.service.ts`)
  - `CollectionService.getCollectionQuestions` (`src/lib/services/collection.service.ts`)
- **FR-BE-003**: Cập nhật API danh sách tài liệu [route.ts](file:///d:/VietElite/project_questionbank/src/app/api/documentcustom/list/route.ts) tại `/api/documentcustom/list`:
  - Lọc danh sách theo `created_by_id = userId` đối với người dùng thông thường (`level_rank < 5`).
  - Đối với admin (`level_rank >= 5`), trả về tất cả tài liệu đồng thời kết nối thêm thông tin tên người tạo (`created_by_name`).

### 3. Frontend UI Changes
- **FR-FE-001** (`QuestionListTable.tsx`):
  - Thêm một cột tiêu đề `Lượt dùng` vào thẻ `thead` của bảng danh sách câu hỏi.
  - Render giá trị `q.export_count || 0` ở mỗi dòng câu hỏi tương ứng.
- **FR-FE-002** (`QuestionDetailModal.tsx`):
  - Thêm badge **"Đã dùng: X lần"** cạnh các badge phân loại ở góc trên cùng bên trái của modal chi tiết câu hỏi.
- **FR-FE-003** (`QuestionLibrary.tsx`):
  - Thêm badge nhỏ với nhãn **"đã dùng X"** ở mỗi thẻ câu hỏi trong danh sách lựa chọn bên phải màn hình soạn tài liệu.
- **FR-FE-004** (`DocumentBuilder.tsx` & `useDocumentBuilder.ts`):
  - Hỗ trợ trường `docType` (mặc định là `"TÀI LIỆU HỌC TẬP"`) trong trạng thái Metadata cấu hình Header.
  - Cho phép người dùng chỉnh sửa thuộc tính này thông qua form Settings và cập nhật giao diện hiển thị động.
- **FR-FE-005** (`SavedDocumentsLibrary.tsx` & `useSavedDocumentsLibrary.ts`):
  - Lấy trạng thái vai trò `isAdmin` của người dùng hiện tại từ endpoint `/api/auth/me`.
  - Nếu là admin, hiển thị badge **"Bởi: <Tên người export>"** cho mỗi bản ghi lịch sử.

---

## Success Criteria

- **SC-001**: Chạy thành công database migration và script khởi tạo số liệu quá khứ không gây lỗi dữ liệu.
- **SC-002**: Khi lưu/xuất tài liệu Custom thành công, giá trị `export_count` của các câu hỏi tương ứng tăng chính xác 1 đơn vị.
- **SC-003**: Hiển thị chính xác badge **"đã dùng X"** tại Thư viện câu hỏi (`QuestionLibrary`), cột **"Lượt dùng"** tại bảng chính và badge thông tin chi tiết trong Modal.
- **SC-004**: Người dùng thay đổi được tiêu đề tài liệu xuất bản và kết quả thay đổi ngay lập tức ở khung soạn thảo.
- **SC-005**: Lọc lịch sử tài liệu hoạt động đúng theo vai trò; admin quan sát được danh tính người tạo.e.ts`)

### 3. Frontend UI Changes
- **FR-FE-001** (`QuestionListTable.tsx`):
  - Thêm một cột tiêu đề `Lượt dùng` vào thẻ `thead` của bảng danh sách câu hỏi.
  - Render giá trị `q.export_count || 0` ở mỗi dòng câu hỏi tương ứng.
- **FR-FE-002** (`QuestionDetailModal.tsx`):
  - Thêm badge **"Đã dùng: X lần"** cạnh các badge phân loại ở góc trên cùng bên trái của modal chi tiết câu hỏi.
- **FR-FE-003** (`QuestionLibrary.tsx`):
  - Thêm badge nhỏ với nhãn **"đã dùng X"** ở mỗi thẻ câu hỏi trong danh sách lựa chọn bên phải màn hình soạn tài liệu.

---

## Success Criteria

- **SC-001**: Chạy thành công database migration và script khởi tạo số liệu quá khứ không gây lỗi dữ liệu.
- **SC-002**: Khi lưu/xuất tài liệu Custom thành công, giá trị `export_count` của các câu hỏi tương ứng tăng chính xác 1 đơn vị.
- **SC-003**: Hiển thị chính xác badge **"đã dùng X"** tại Thư viện câu hỏi (`QuestionLibrary`), cột **"Lượt dùng"** tại bảng chính và badge thông tin chi tiết trong Modal.
