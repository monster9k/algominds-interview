import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

// Shape Gemini is instructed to return for evaluateCode() — see the
// evaluationModel's systemInstruction below. Fields stay loosely typed
// since this is untrusted model output, validated below before use.
interface GeminiEvaluationResponse {
  scores?: {
    logic?: unknown;
    cleanCode?: unknown;
    performance?: unknown;
    bestPractices?: unknown;
  };
  feedback?: string;
  pros?: unknown;
  cons?: unknown;
}

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel; // For Phase 1 Strategy evaluation
  private evaluationModel: GenerativeModel; // For Phase 3 Code evaluation

  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    );

    // Model 1: Phase 1 Strategy Evaluation
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction: `
        Bạn là AI interviewer, đánh giá giải pháp (Strategy) của ứng viên cho bài toán.

        INPUT: Ngữ cảnh bài toán và câu trả lời của ứng viên.
        OUTPUT: Bắt buộc trả về JSON theo đúng định dạng sau:
        {
         "status": "Approved" | "Rejected",
         "message": "string"
        }

        QUY TẮC ĐÁNH GIÁ:
        1. Nếu giải pháp SAI hoặc không giải được bài toán:
          - Gán "status": "Rejected".
          - "message": Giải thích rõ chỗ sai và vì sao không đúng.

        2. Nếu giải pháp ĐÚNG nhưng CHƯA TỐI ƯU:
          - Gán "status": "Approved".
          - "message": Xác nhận đúng, phản hồi xây dựng, và gợi ý hướng tối ưu hơn (không đưa code mẫu).

        3. Nếu giải pháp ĐÚNG và TỐI ƯU:
          - Gán "status": "Approved".
          - "message": Khen ngợi ngắn gọn, tích cực.

        4. Không từ chối chỉ vì chưa tối ưu. Ưu tiên đánh giá đúng/sai trước, tối ưu sau.
        5. Nếu ứng viên chat linh tinh không liên quan:
          - Gán "status": "Rejected".
          - "message": Nhắc nhở tập trung vào giải pháp cho bài toán.
      `,
    });

    // Model 2: Phase 3 Code Evaluation (Clean Code + Performance + Best Practices)
    this.evaluationModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction: `
        Bạn là Senior Code Reviewer từ Google/Facebook.
        Nhiệm vụ: Đánh giá mã code của ứng viên theo tiêu chí chuyên nghiệp.

        OUTPUT: Bắt buộc trả về JSON theo định dạng sau:
        {
          "scores": {
            "logic": 0-100,
            "cleanCode": 0-100,
            "performance": 0-100,
            "bestPractices": 0-100
          },
          "feedback": "Nhận xét tổng quát về code",
          "pros": ["Điểm mạnh 1", "Điểm mạnh 2"],
          "cons": ["Cần cải thiện 1", "Cần cải thiện 2"]
        }

        TIÊU CHÍ ĐÁNH GIÁ:
        1. Logic (0-100): Thuật toán có đúng, xử lý edge case, độ phức tạp tối ưu không?
        2. Clean Code (0-100): Đặt tên biến/hàm rõ ràng, cấu trúc code sạch, dễ bảo trì, comment hợp lý?
        3. Performance (0-100): Tận dụng tối ưu, tránh vòng lặp lồng không cần, memory efficient?
        4. Best Practices (0-100): Tuân theo coding standards, error handling, modularity?

        VÍ DỤ:
        - Tên biến "a", "b", "temp" → TỆRAAA (cleanCode thấp)
        - Xử lý đúng nhưng chạy O(n²) khi có thể O(n log n) → performance thấp
        - Code dài dòng, lặp lại logic → cleanCode và bestPractices thấp

        Hãy chi tiết, xây dựng nhưng cũng chỉ ra cơ hội cải thiện.
      `,
    });
  }

  async generateResponse(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string,
    problemContext: string,
  ) {
    try {
      // 1. TẠO NGỮ CẢNH GIẢ (Context Injection)
      // Để đảm bảo luật "User -> Model", ta chèn cặp tin nhắn này vào đầu
      const contextHistory = [
        {
          role: 'user',
          parts: [
            {
              text: `SYSTEM_CONTEXT: Đây là bài toán tôi cần giải quyết:\n${problemContext}`,
            },
          ],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Đã hiểu. Tôi đã nắm rõ đề bài và các giới hạn. Hãy bắt đầu phỏng vấn.',
            },
          ],
        },
      ] as { role: 'user' | 'model'; parts: { text: string }[] }[];

      const fullHistory = [...contextHistory, ...history];
      // khởi tạo đoạn chat với lịch sử cũ
      const chat = this.model.startChat({
        history: fullHistory,
      });
      // gửi tin nhắn mới
      const result = await chat.sendMessage(newMessage);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini Error:', error);
      return 'Xin lỗi, server AI đang quá tải (hoặc hết lượt miễn phí). Vui lòng thử lại sau 1 phút!';
    }
  }

  async evaluateCode(
    code: string,
    language: string,
    problemContext: string,
  ): Promise<{
    scores: {
      logic: number;
      cleanCode: number;
      performance: number;
      bestPractices: number;
    };
    feedback: string;
    pros: string[];
    cons: string[];
  }> {
    try {
      const prompt = `
Mã code cần đánh giá (${language}):
\`\`\`${language}
${code}
\`\`\`

Bài toán:
${problemContext}

Hãy đánh giá code này theo 4 tiêu chí: logic, cleanCode, performance, bestPractices.
      `;

      const chat = this.evaluationModel.startChat({
        history: [],
      });

      const result = await chat.sendMessage(prompt);
      const response = result.response;
      const rawResponse = response.text();

      // Parse JSON response
      const evaluation = JSON.parse(rawResponse) as GeminiEvaluationResponse;

      // Validate structure
      if (
        !evaluation.scores ||
        typeof evaluation.scores.logic !== 'number' ||
        typeof evaluation.scores.cleanCode !== 'number' ||
        typeof evaluation.scores.performance !== 'number' ||
        typeof evaluation.scores.bestPractices !== 'number'
      ) {
        throw new Error('Invalid scores structure from AI');
      }

      return {
        scores: {
          logic: evaluation.scores.logic,
          cleanCode: evaluation.scores.cleanCode,
          performance: evaluation.scores.performance,
          bestPractices: evaluation.scores.bestPractices,
        },
        feedback: evaluation.feedback || '',
        pros: Array.isArray(evaluation.pros)
          ? (evaluation.pros as string[])
          : [],
        cons: Array.isArray(evaluation.cons)
          ? (evaluation.cons as string[])
          : [],
      };
    } catch (error) {
      console.error('Code Evaluation Error:', error);
      throw new Error(
        `Failed to evaluate code: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
