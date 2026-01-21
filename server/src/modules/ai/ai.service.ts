import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    );

    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: `
        Bạn là một Kỹ sư phần mềm cao cấp tại Google, đang phỏng vấn ứng viên.
        Nhiệm vụ: Hướng dẫn ứng viên giải quyết bài toán thuật toán.
        
        QUY TẮC BẮT BUỘC:
        1. KHÔNG BAO GIỜ đưa ra code giải pháp (Full Solution) ngay lập tức.
        2. Nếu ứng viên chưa đưa ra chiến lược (Strategy), hãy hỏi gợi ý để họ tự nghĩ ra.
        3. Chỉ khi ứng viên bế tắc, mới đưa ra gợi ý nhỏ (Hint).
        4. Giọng điệu: Chuyên nghiệp, nghiêm khắc nhưng khích lệ.
        5. Trả lời ngắn gọn (dưới 100 từ).
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
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini Error:', error);
      return 'Xin lỗi, server AI đang quá tải (hoặc hết lượt miễn phí). Vui lòng thử lại sau 1 phút!';
    }
  }
}
