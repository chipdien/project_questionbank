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

const ClassificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    classifications: {
      type: Type.ARRAY,
      description: "Danh sách kết quả phân loại cho từng câu hỏi",
      items: {
        type: Type.OBJECT,
        properties: {
          question_id: {
            type: Type.INTEGER,
            description: "ID của câu hỏi"
          },
          grade: {
            type: Type.STRING,
            description: "Khối lớp (chỉ điền số từ 6 đến 12 dưới dạng chuỗi)",
            enum: ["6", "7", "8", "9", "10", "11", "12"]
          },
          difficulty: {
            type: Type.STRING,
            description: "Độ khó của câu hỏi",
            enum: ["Dễ", "Trung Bình", "Khó"]
          },
          lesson_id: {
            type: Type.INTEGER,
            description: "ID của bài học phù hợp nhất từ danh sách được cung cấp. Nếu không có bài nào phù hợp, hãy để null.",
            nullable: true
          }
        },
        required: ["question_id", "grade", "difficulty"]
      }
    }
  },
  required: ["classifications"]
};

/**
 * Service chuyên bóc tách câu hỏi từ văn bản LaTeX/Thô.
 */
export class QuestionParserService {
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

/**
 * Service chuyên phân loại câu hỏi (Khối lớp, Bài học, Độ khó).
 */
export class QuestionClassifierService {
  static async classify(
    questions: { id: number; statement: string }[],
    lessons: { id: number; name: string }[]
  ) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const lessonsContext = lessons.map(l => `ID: ${l.id}, Name: ${l.name}`).join('\n');
    const questionsContext = questions.map(q => `ID: ${q.id}, Content: ${q.statement}`).join('\n---\n');

    const systemInstruction = `Bạn là một chuyên gia giáo dục xuất sắc.
Nhiệm vụ của bạn là phân loại danh sách câu hỏi được cung cấp vào Khối lớp, Độ khó và Bài học phù hợp.

Dưới đây là danh sách các Bài học (ID và Tên) có sẵn trong hệ thống:
${lessonsContext}

Yêu cầu:
1. Khối lớp: Chọn từ 6 đến 12 dựa trên nội dung kiến thức của câu hỏi.
2. Độ khó: Phân loại 'Dễ', 'Trung Bình', hoặc 'Khó'.
3. Bài học: Tìm trong danh sách trên bài học có nội dung sát nhất với câu hỏi. Trả về ID của bài học đó. Nếu hoàn toàn không có bài học nào liên quan, hãy trả về null.

Lưu ý quan trọng:
- Chỉ trả về dữ liệu JSON theo đúng schema được yêu cầu.
- Không tự ý tạo ra ID bài học mới không có trong danh sách.
- Đảm bảo ánh xạ đúng ID câu hỏi (question_id).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Hãy phân loại danh sách câu hỏi sau:\n${questionsContext}` }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: ClassificationSchema,
        temperature: 0.1,
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Không nhận được phản hồi phân loại từ AI");
    }

    try {
      const parsedData = JSON.parse(outputText);
      return parsedData.classifications as {
        question_id: number;
        grade: string;
        difficulty: string;
        lesson_id: number | null;
      }[];
    } catch (e: any) {
      throw new Error("Failed to parse Classification JSON from AI: " + e.message);
    }
  }
}
