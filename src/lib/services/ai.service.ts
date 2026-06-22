import { GoogleGenAI, Type, Schema } from '@google/genai';
import { prisma } from '@/lib/db';

// Initialize SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const QuestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer_matched: {
      type: Type.BOOLEAN,
      description: "Chỉ dùng khi có file đáp án riêng. true nếu file đáp án thực sự tương ứng với đề bài; false nếu file đáp án rõ ràng KHÔNG liên quan đến đề (sai môn, sai nội dung, các câu không khớp). Để null nếu không có file đáp án.",
      nullable: true
    },
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
            description: "Khối lớp (chỉ điền số từ 1 đến 12 dưới dạng chuỗi)",
            enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
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
  static async parseQuestions(rawLatex: string, rawAnswerText?: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const hasAnswerFile = !!(rawAnswerText && rawAnswerText.trim().length > 0);

    const baseInstruction = `Bạn là một trợ lý AI xử lý tài liệu Toán học xuất sắc.
Nhiệm vụ của bạn là nhận vào văn bản text được trích xuất từ OCR (dưới định dạng LaTeX) và bóc tách thành các câu hỏi có cấu trúc.
Chú ý:
- Văn bản đầu vào có thể chứa cả các đề bài (ví dụ "Câu 1:", "Bài 1.") và các lựa chọn đáp án kiểu "A.", "B.", "C.", "D.".
- Nếu là câu hỏi trắc nghiệm, ĐẢM BẢO loại bỏ hoàn toàn các dòng chứa đáp án A/B/C/D ra khỏi phần nội dung đề (statement) và phân tách chúng cho vào mảng options.
- Lời giải hoặc hướng dẫn (nếu có) phải được bóc tách và đặt vào trường hint.
- Đảm bảo giữ nguyên các công thức LaTeX hợp lệ (được bao bọc trong $ hoặc $$).
- TUYỆT ĐỐI GIỮ NGUYÊN mọi cú pháp hình ảnh (ví dụ: ![](...) hoặc thẻ <img>) trong nội dung câu hỏi và đáp án. Không được tự ý xóa bỏ hình ảnh.

QUY TẮC ĐẶC BIỆT CHO BẢNG BIẾN THIÊN (BBT):
Nếu trong câu hỏi hoặc lời giải có chứa Bảng biến thiên (thường được biểu diễn dưới dạng bảng Markdown thô hoặc môi trường tabular/array/matrix trong LaTeX), bạn bắt buộc phải chuyển đổi bảng đó sang định dạng JSON đặc biệt được đặt trong khối mã \`\`\`bbt ... \`\`\`.

Cấu trúc JSON trong khối \`\`\`bbt phải tuân thủ schema sau:
{
  "cols": [
    { "x": "giá trị x", "y_prime": "giá trị đạo hàm", "y": "giá trị hàm số", "y_pos": "top" | "bottom" | "middle" | "bottom/top" | "top/bottom" }, // Cột Điểm
    { "y_prime_sign": "+" | "-" | "0" } // Cột Khoảng (nằm xen kẽ giữa các cột điểm)
  ]
}

Ví dụ:
Đối với bảng biến thiên có:
- x chạy từ -\\infty đến -1, rồi đến 2, rồi đến +\\infty
- y' có dấu +, 0, -, ||, +
- y có các giá trị cực trị tương ứng

Bạn phải sinh ra khối mã sau trong "statement" hoặc "hint":
\`\`\`bbt
{
  "cols": [
    { "x": "-\\infty", "y_prime": "", "y": "-\\infty", "y_pos": "bottom" },
    { "y_prime_sign": "+" },
    { "x": "-1", "y_prime": "0", "y": "3", "y_pos": "top" },
    { "y_prime_sign": "-" },
    { "x": "2", "y_prime": "||", "y": "-\\infty/+\\infty", "y_pos": "bottom/top" },
    { "y_prime_sign": "+" },
    { "x": "+\\infty", "y_prime": "", "y": "+\\infty", "y_pos": "top" }
  ]
}
\`\`\`
Lưu ý đặc biệt quan trọng:
- Bạn TUYỆT ĐỐI không được bỏ sót bất kỳ con số nào xuất hiện ở dòng y trong bảng biến thiên gốc (ví dụ các cực trị như -7, -2, 20...). Mọi điểm cực trị đều phải có giá trị y điền đầy đủ.
- Ở dòng y', chỉ điền giá trị đạo hàm (như "0", "||") tại các cột Điểm có cực trị thực tế. Tại các cột Điểm đại diện cho vô cực (như -\infty hoặc +\infty), bạn bắt buộc phải để trống trường "y_prime": "" (không được tự ý điền "0" vào đây).
`;

    const answerInstruction = `

QUAN TRỌNG - XỬ LÝ FILE ĐÁP ÁN RIÊNG:
Bạn được cung cấp ĐỒNG THỜI hai nguồn văn bản:
1. "VĂN BẢN ĐỀ BÀI": chứa nội dung các câu hỏi/đề bài.
2. "VĂN BẢN ĐÁP ÁN & LỜI GIẢI": chứa đáp án đúng và lời giải chi tiết cho các câu hỏi tương ứng.

Yêu cầu đối chiếu:
- Chỉ bóc tách câu hỏi từ "VĂN BẢN ĐỀ BÀI" (statement, options lấy từ file đề).
- TRƯỚC TIÊN, hãy đánh giá độ liên quan tổng thể giữa hai văn bản:
  + Nếu "VĂN BẢN ĐÁP ÁN & LỜI GIẢI" RÕ RÀNG KHÔNG phải là đáp án/lời giải của đề này (khác môn học, nội dung hoàn toàn không tương ứng, các câu không thể ánh xạ được), hãy đặt answer_matched = false và BỎ QUA HOÀN TOÀN file đáp án: mọi hint để chuỗi rỗng, mọi weight = 0. KHÔNG được suy đoán hay ghép ép theo số thứ tự.
  + Nếu file đáp án thực sự khớp với đề (phần lớn câu có thể đối chiếu được), hãy đặt answer_matched = true rồi tiến hành đối chiếu bên dưới.
- Khi đã khớp: với mỗi câu hỏi, tìm đáp án & lời giải tương ứng trong "VĂN BẢN ĐÁP ÁN & LỜI GIẢI" (đối chiếu theo số thứ tự câu, ví dụ "Câu 1" trong đề khớp với "Câu 1" trong đáp án).
- Điền LỜI GIẢI CHI TIẾT từ file đáp án vào trường hint của câu hỏi đó.
- Đánh dấu weight = 1 cho đúng lựa chọn (option) được xác định là đáp án đúng dựa trên file đáp án; các lựa chọn còn lại weight = 0.
- Nếu một câu hỏi cụ thể không tìm thấy đáp án tương ứng (dù tổng thể đã khớp), để hint là chuỗi rỗng và giữ weight = 0 cho mọi lựa chọn của câu đó.`;

    const systemInstruction = hasAnswerFile ? baseInstruction + answerInstruction : baseInstruction;

    const userText = hasAnswerFile
      ? `===== VĂN BẢN ĐỀ BÀI =====\n${rawLatex}\n\n===== VĂN BẢN ĐÁP ÁN & LỜI GIẢI =====\n${rawAnswerText}`
      : rawLatex;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: userText }]
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

    let difficultyEnum = ["Dễ", "Trung Bình", "Khó"]; // Fallback mặc định
    try {
      const dbDiffs = await prisma.lms_difficulties.findMany({
        orderBy: { display_order: 'asc' },
        select: { name: true },
      });
      if (dbDiffs && dbDiffs.length > 0) {
        difficultyEnum = dbDiffs.map((d) => d.name);
      }
    } catch (dbError) {
      console.error('Failed to load dynamic difficulties for AI, using fallback:', dbError);
    }

    const lessonsContext = lessons.map(l => `ID: ${l.id}, Name: ${l.name}`).join('\n');
    const questionsContext = questions.map(q => `ID: ${q.id}, Content: ${q.statement}`).join('\n---\n');

    const systemInstruction = `Bạn là một chuyên gia giáo dục xuất sắc.
Nhiệm vụ của bạn là phân loại danh sách câu hỏi được cung cấp vào Khối lớp, Độ khó và Bài học phù hợp.

Dưới đây là danh sách các Bài học (ID và Tên) có sẵn trong hệ thống:
${lessonsContext}

Yêu cầu:
1. Khối lớp: Chọn từ 1 đến 12 dựa trên nội dung kiến thức của câu hỏi.
2. Độ khó: Phân loại một trong các mức: ${difficultyEnum.map(d => `'${d}'`).join(', ')}.
3. Bài học: Tìm trong danh sách trên bài học có nội dung sát nhất với câu hỏi. Trả về ID của bài học đó. Nếu hoàn toàn không có bài học nào liên quan, hãy trả về null.

Lưu ý quan trọng:
- Chỉ trả về dữ liệu JSON theo đúng schema được yêu cầu.
- Không tự ý tạo ra ID bài học mới không có trong danh sách.
- Đảm bảo ánh xạ đúng ID câu hỏi (question_id).`;

    // Clone schema và gán enum động
    const dynamicSchema = JSON.parse(JSON.stringify(ClassificationSchema));
    if (
      dynamicSchema.properties?.classifications?.items?.properties?.difficulty
    ) {
      dynamicSchema.properties.classifications.items.properties.difficulty.enum = difficultyEnum;
    }

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
        responseSchema: dynamicSchema,
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
