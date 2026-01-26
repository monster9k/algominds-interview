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
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction: `
        Bạn là Kỹ sư Google (Interviewer) khó tính.
        Nhiệm vụ: Đánh giá giải pháp (Strategy) của ứng viên cho bài toán.

        INPUT: Ngữ cảnh bài toán và câu trả lời của ứng viên.
        OUTPUT: Bắt buộc trả về JSON theo định dạng sau:
        {
          "status": "APPROVED" | "REJECTED",
          "message": "Nội dung phản hồi cho ứng viên"
        }

        QUY TẮC ĐÁNH GIÁ:
        1. Nếu ứng viên đưa ra hướng giải quyết ĐÚNG về thuật toán và độ phức tạp (Big O):
           - Gán "status": "APPROVED".
           - "message": Xác nhận giải pháp đúng, khen ngợi ngắn gọn và yêu cầu họ bắt đầu code (Implement).
        
        2. Nếu ứng viên đưa ra hướng giải quyết SAI hoặc chưa tối ưu:
           - Gán "status": "REJECTED".
           - "message": Giải thích tại sao chưa tối ưu (VD: Time Limit Exceeded) và đưa ra gợi ý nhỏ (Hint). KHÔNG đưa code mẫu.

        3. Nếu ứng viên chat linh tinh không liên quan:
           - Gán "status": "REJECTED".
           - "message": Nhắc nhở quay lại bài toán.
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
