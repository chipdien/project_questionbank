# Đặc tả tính năng: Tái cấu trúc Tab Import Tài liệu (Split-Screen & Phân loại câu hỏi)

**Feature Branch**: `009-import-document-questions`

**Created**: 2026-06-16

**Status**: Draft

**Input**: Yêu cầu người dùng tái cấu trúc luồng Import Tài liệu thành 4 bước rõ ràng:
1. **Step 1 (Tải lên)**: Giao diện tối giản, nút upload nhỏ gọn nhưng dễ thấy, hỗ trợ kéo thả. Tải lên tối đa 1 file PDF/DOCX hoặc nhiều file Ảnh (PNG, JPG, JPEG).
2. **Step 2 (Xử lý)**: Overlay phủ toàn bộ, hiệu ứng blur, khóa tương tác chuột, hiển thị loading spinner và cập nhật chi tiết tiến trình đang xử lý.
3. **Step 3 (Phân loại & Đối chiếu)**: Màn hình chia làm 3 cột (Cột 1: File gốc; Cột 2: Câu hỏi Mathpix kèm checkbox tích chọn nhiều; Cột 3: Panel phân loại cây chủ đề & tags cho phép xử lý đơn lẻ hoặc hàng loạt). Đúp click câu hỏi để mở Modal chỉnh sửa chi tiết.
4. **Step 4 (Lưu & Chia sẻ)**: Modal hoàn tất cho phép lưu (Private) hoặc Công khai (Public) kèm sao chép liên kết chia sẻ nhanh.

---

## User Scenarios & Testing

### User Story 1 - Tải lên tập tin trực quan & giới hạn định dạng (Priority: P1)
*Là một Giáo viên, tôi muốn tải lên 1 tài liệu PDF/Word duy nhất hoặc nhiều ảnh chụp đề bài để hệ thống phân tích, đảm bảo giao diện gọn gàng nhưng nút tải lên luôn dễ tìm thấy.*

*   **Independent Test**:
    1. Truy cập tab "Import tài liệu".
    2. Kiểm tra khi chưa có file, vùng kéo thả (Dropzone) chiếm trọn khu vực hiển thị. Nút "Upload" nhỏ gọn nằm trên thanh công cụ cũng hiển thị rõ ràng.
    3. Chọn tải lên cùng lúc 3 file ảnh (PNG/JPG): Hệ thống PHẢI chấp nhận và hiển thị danh sách ảnh xem trước.
    4. Chọn tải lên cùng lúc 2 file PDF: Hệ thống PHẢI hiển thị thông báo lỗi và từ chối xử lý (chỉ cho phép 1 file PDF/DOCX).
*   **Acceptance Scenarios**:
    *   **Given** người dùng chọn ảnh, **When** số lượng ảnh > 1, **Then** hệ thống chấp nhận và kích hoạt nút submit.
    *   **Given** người dùng chọn file PDF/Word, **When** số lượng file > 1, **Then** hệ thống báo lỗi *"Chỉ cho phép tải lên duy nhất 1 tập tin tài liệu (PDF/DOCX) hoặc nhiều ảnh"* và vô hiệu hóa nút submit.

---

### User Story 2 - Trạng thái xử lý rõ ràng & không bị gián đoạn (Priority: P1)
*Là một Người dùng, tôi muốn biết chính xác hệ thống đang thực hiện bước xử lý nào (OCR, Phân tách câu hỏi, Đối chiếu đáp án) với hiệu ứng khóa màn hình để tránh việc tôi vô tình click vào các tính năng khác làm gián đoạn tiến trình.*

*   **Independent Test**:
    1. Nhấn nút "Bắt đầu xử lý" sau khi tải file thành công.
    2. Xác nhận một overlay mờ (`backdrop-blur-sm bg-slate-900/40`) xuất hiện toàn màn hình.
    3. Thử click chuột vào menu bên trái hoặc các nút trên trang: Hệ thống PHẢI khóa tương tác hoàn toàn.
    4. Theo dõi spinner và các dòng chữ mô tả trạng thái tiến trình thay đổi động cho đến khi thành công.
*   **Acceptance Scenarios**:
    *   **Given** tài liệu đang xử lý, **When** API trả về kết quả từng giai đoạn, **Then** văn bản loading cập nhật tương ứng thời gian thực và không có lỗi treo tiến trình quá 5 phút.

---

### User Story 3 - Đối chiếu trực quan & Phân loại hàng loạt (Priority: P1)
*Là một Giáo viên, tôi muốn xem song song file gốc và các câu hỏi sau khi xử lý để đối chiếu độ chính xác, đồng thời có thể phân loại nhanh (gán cây chủ đề, tag) cho từng câu hoặc chọn nhiều câu để gán đồng loạt.*

*   **Independent Test**:
    1. Giao diện sau xử lý hiển thị 3 cột: Trái (File gốc), Giữa (Câu hỏi Mathpix), Phải (Bảng phân loại).
    2. Cột trái hiển thị PDF viewer (nếu là PDF) hoặc danh sách ảnh cuộn.
    3. Tích chọn checkbox ở đầu Câu 1 và Câu 3 tại cột giữa.
    4. Panel bên phải (cột 3) PHẢI tự động chuyển sang chế độ "Phân loại hàng loạt" (Bulk Mode), báo cáo *"Đang chọn 2 câu hỏi"*.
    5. Chọn chủ đề "Toán 12 -> Khảo sát hàm số" và bấm "Áp dụng đồng loạt".
    6. Kiểm tra lại Câu 1 và Câu 3: Cả hai câu hỏi PHẢI hiển thị đúng badge chủ đề mới gán.
    7. Click đúp chuột vào Câu 2: Modal chỉnh sửa chi tiết mở ra, cho phép chỉnh sửa nội dung văn bản đề bài và đáp án.
*   **Acceptance Scenarios**:
    *   **Given** user tích chọn nhiều câu hỏi, **When** chọn chủ đề hoặc tag ở panel phải, **Then** hành động này áp dụng đồng loạt cho tất cả các câu được chọn mà không ghi đè các tag riêng lẻ khác (hoặc cho phép ghi đè tùy chọn).

---

### User Story 4 - Quyền riêng tư & Chia sẻ nhanh (Priority: P2)
*Là một Quản trị viên, tôi muốn lưu đề thi này ở chế độ công khai để các giáo viên khác trong hệ thống có thể cùng sử dụng, hoặc đặt chế độ riêng tư nếu đó là đề thi thử nội bộ của lớp tôi.*

*   **Independent Test**:
    1. Nhấn nút "Lưu & Hoàn tất".
    2. Modal cấu hình mở ra, chọn chế độ "Công khai (Public)".
    3. Sau khi xác nhận lưu, hệ thống hiển thị đường dẫn chia sẻ nhanh. Bấm nút sao chép và chia sẻ link cho đồng nghiệp.
    4. Đồng nghiệp mở link chia sẻ: Đọc được tài liệu và các câu hỏi đã được phân loại trong ngân hàng.
*   **Acceptance Scenarios**:
    *   **Given** tài liệu được lưu là "Public", **When** lưu vào DB, **Then** trường `public` của bảng `lms_documents` được ghi nhận giá trị `'1'` và các giáo viên khác có thể tìm thấy trong thư viện dùng chung.

---

## Requirements

### Functional Requirements

*   **FR-001 (Step 1 - Upload)**:
    *   Hệ thống PHẢI có giao diện kéo thả tập tin tích hợp với react-dropzone.
    *   Button upload trên thanh công cụ PHẢI được thiết kế nhỏ gọn (kích thước tối đa `height: 36px` hoặc `py-1.5`) nhưng sử dụng màu sắc đồng bộ (Primary/Secondary) và icon rõ ràng.
    *   Chỉ cho phép tải lên tối đa **1 file PDF hoặc 1 file DOCX**.
    *   Cho phép chọn **nhiều file Ảnh (JPG, JPEG, PNG)** cùng lúc.
*   **FR-002 (Step 2 - Processing)**:
    *   Hệ thống PHẢI kích hoạt overlay toàn màn hình, sử dụng hiệu ứng `backdrop-blur-[4px] bg-slate-900/30`.
    *   Chặn toàn bộ tương tác click và hover của người dùng lên các phần ngoài vùng hiển thị loading.
    *   Cập nhật trạng thái text tương ứng các tiến trình:
        1. *Đọc và chuẩn bị dữ liệu...*
        2. *Đang gửi dữ liệu phân tích OCR (Mathpix)...*
        3. *AI đang tách câu hỏi và đối chiếu đáp án...*
        4. *Hoàn tất, đang dựng giao diện đối chiếu...*
*   **FR-003 (Step 3 - Split-Screen Layout)**:
    *   Màn hình chính PHẢI được chia làm 3 cột cố định có thanh cuộn riêng biệt (`overflow-y-auto`):
        *   **Cột 1 (File gốc - Chiếm ~45% chiều rộng)**:
            *   PDF: Tích hợp `react-pdf` hoặc `iframe` nội bộ để hiển thị trực tiếp.
            *   Ảnh: Hiển thị danh sách ảnh xếp dọc dạng slide cuộn mượt mà.
            *   DOCX: Sử dụng thư viện `mammoth` hoặc tương đương để parse và render nội dung thô dạng HTML.
        *   **Cột 2 (Câu hỏi Mathpix - Chiếm ~40% chiều rộng)**:
            *   Hiển thị danh sách câu hỏi trích xuất từ tài liệu.
            *   Mỗi card câu hỏi PHẢI chứa checkbox ở đầu dòng.
            *   Hỗ trợ phím mũi tên hoặc click để chọn tiêu điểm câu hỏi.
            *   Đúp click (Double-click) vào card câu hỏi PHẢI mở ra `QuestionEditModal` để biên soạn chi tiết.
        *   **Cột 3 (Bảng phân loại - Chiếm ~15% chiều rộng)**:
            *   Chứa cây chủ đề đệ quy (`lms_topics`) và thẻ phân loại bổ trợ (`lms_tags`).
            *   Có nút toggle Collapse ở mép để thu gọn/mở rộng. Khi thu gọn, diện tích được nhường lại cho cột 2.
            *   **Single Mode**: Gán phân loại cho 1 câu hỏi đang chọn.
            *   **Bulk Mode**: Gán phân loại/tags đồng loạt cho các câu hỏi đang tích checkbox ở cột 2.
*   **FR-004 (Step 4 - Share & Public)**:
    *   Hệ thống PHẢI cung cấp Modal xác nhận khi nhấn nút "Lưu & Hoàn tất".
    *   Modal cho phép đổi tên tài liệu, tích chọn "Private" hoặc "Public" (chia sẻ với mọi giáo viên).
    *   Nếu chọn "Public", hiển thị trường text chứa liên kết tĩnh của đề bài cùng nút "Sao chép nhanh".

### Non-Functional Requirements

*   **NFR-001 (Hiệu năng)**: Thời gian chuyển đổi giữa trạng thái chọn 1 câu sang chọn nhiều câu và cập nhật giao diện của Panel phân loại bên phải PHẢI dưới 50ms.
*   **NFR-002 (Bảo mật)**: Chỉ có chủ tài liệu (hoặc Admin) mới có quyền chỉnh sửa, phân loại và chia sẻ bộ câu hỏi đó. API PHẢI xác thực token người dùng trước khi ghi nhận thay đổi vào CSDL.
*   **NFR-003 (Trải nghiệm)**: Panel phân loại khi thu gọn PHẢI lưu trữ trạng thái (cookie hoặc localStorage) để khi người dùng chuyển trang hoặc tải lại không bị tự động mở rộng ra gây khó chịu.

---

## Success Criteria

*   **SC-001**: Giao diện chia 3 cột hiển thị đồng bộ, không bị tràn dòng hoặc vỡ khung trên các màn hình có độ phân giải từ 1280px trở lên.
*   **SC-002**: Tính năng phân loại hàng loạt hoạt động chính xác 100%, không xảy ra tình trạng mất dữ liệu hay lỗi bất đồng bộ khi cập nhật đồng thời nhiều câu hỏi trong DB.
*   **SC-003**: PDF Viewer tải nhanh, hiển thị đúng từng trang khớp với file người dùng đưa lên.
*   **SC-004**: Trạng thái overlay của Step 2 khóa tương tác an toàn, tự động giải phóng (cleanup) nếu xảy ra lỗi xử lý hoặc timeout (>5 phút) để người dùng không bị kẹt trang.
