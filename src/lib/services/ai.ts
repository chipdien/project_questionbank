import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const QuestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description: "Danh sách các câu hỏi được trích xuất từ văn bản LaTeX",
      items: {
        type: Type.OBJECT,
        properties: {
          statement: {
            type: Type.STRING,
            description: "Nội dung câu hỏi (chỉ phần đề bài, đã chuẩn hóa định dạng LaTeX, ĐẢM BẢO GIỮ NGUYÊN các thẻ hình ảnh Markdown/HTML nếu có, KHÔNG bao gồm các lựa chọn đáp án trắc nghiệm A B C D)"
          },
          question_type: {
            type: Type.STRING,
            description: "Loại câu hỏi. Có thể là 'SINGLE_CHOICE', 'MULTIPLE_CHOICE' hoặc 'ESSAY'",
            enum: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "ESSAY"]
          },
          hint: {
            type: Type.STRING,
            description: "Gợi ý hoặc lời giải chi tiết (nếu có trong đề, nếu không có để chuỗi rỗng)",
            nullable: true
          },
          options: {
            type: Type.ARRAY,
            description: "Danh sách các đáp án lựa chọn (A, B, C, D). Nếu là bài tự luận (ESSAY), mảng này rỗng.",
            items: {
              type: Type.OBJECT,
              properties: {
                content: {
                  type: Type.STRING,
                  description: "Nội dung của lựa chọn. ĐẢM BẢO GIỮ NGUYÊN các thẻ hình ảnh nếu có."
                },
                order: {
                  type: Type.INTEGER,
                  description: "Thứ tự của lựa chọn (1 tương ứng A, 2 tương ứng B, 3 tương ứng C, 4 tương ứng D)"
                },
                weight: {
                  type: Type.INTEGER,
                  description: "Trọng số điểm. 1 nếu là đáp án đúng (nếu đề có đánh dấu), 0 nếu là đáp án sai hoặc không rõ"
                }
              },
              required: ["content", "order", "weight"]
            }
          }
        },
        required: ["statement", "question_type", "options"]
      }
    }
  },
  required: ["questions"]
};

export class AiService {
  /**
   * Phân tích văn bản gốc và trích xuất thành cấu trúc JSON chuẩn.
   */
  static async parseQuestions(rawLatex: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemInstruction = `Bạn là một trợ lý AI xử lý tài liệu Toán học xuất sắc.
Nhiệm vụ của bạn là nhận vào văn bản text được trích xuất từ OCR (dưới định dạng LaTeX) và bóc tách thành các câu hỏi có cấu trúc.
Chú ý:
- Văn bản đầu vào có thể chứa cả các đề bài (ví dụ "Câu 1:", "Bài 1.") và các lựa chọn đáp án kiểu "A.", "B.", "C.", "D.".
- Nếu là câu hỏi trắc nghiệm, ĐẢM BẢO loại bỏ hoàn toàn các dòng chứa đáp án A/B/C/D ra khỏi phần nội dung đề (statement) và phân tách chúng cho vào mảng options.
- Lời giải hoặc hướng dẫn (nếu có) phải được bóc tách và đặt vào trường hint.
- Đảm bảo giữ nguyên các công thức LaTeX hợp lệ (được bao bọc trong $ hoặc $$).
- TUYỆT ĐỐI GIỮ NGUYÊN mọi cú pháp hình ảnh (ví dụ: ![](...) hoặc thẻ <img>) trong nội dung câu hỏi và đáp án. Không được tự ý xóa bỏ hình ảnh.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: rawLatex }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: QuestionSchema,
        temperature: 0.1, // Thấp để tăng tính chính xác
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Không nhận được phản hồi từ AI");
    }

    try {
      const parsedData = JSON.parse(outputText);
      return parsedData;
    } catch (e: any) {
      throw new Error("Failed to parse JSON from AI: " + e.message);
    }
  }
}
