import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../prisma/prisma.service';

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

// Nối vào cuối systemInstruction gốc khi persona có systemPromptExtra —
// KHÔNG thay đổi khối JSON contract/quy tắc cốt lõi bên trên.
const STRATEGY_SYSTEM_INSTRUCTION = `
        Bạn là AI interviewer, đánh giá giải pháp (Strategy) của ứng viên cho bài toán.

        INPUT: Ngữ cảnh bài toán và câu trả lời của ứng viên.
        OUTPUT: Bắt buộc trả về JSON theo đúng định dạng sau:
        {
         "status": "Approved" | "Rejected",
         "message": "string",
         "confidenceSignal": "hedging" | "neutral" | "assertive"
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
        6. "confidenceSignal" đánh giá RIÊNG cách ứng viên DIỄN ĐẠT câu trả lời
           (không liên quan tới "status" đúng/sai):
          - "hedging": dùng nhiều từ ngờ vực như "có thể", "em nghĩ là", "không chắc lắm", "hình như".
          - "assertive": khẳng định chắc chắn, dứt khoát, không rào đón.
          - "neutral": không rõ nghiêng về hướng nào, hoặc câu trả lời quá ngắn để đánh giá giọng điệu.
      `;

// Offer Debrief (career.processor.ts) — tổng hợp nhiều strategyAnswer đã
// APPROVED của cùng 1 bài toán thành 1 đoạn digest. Output là text tự do
// (không cần JSON contract) nên không set responseMimeType như 2 model kia.
const OFFER_DEBRIEF_SYSTEM_INSTRUCTION = `
        Bạn là 1 senior interviewer tổng hợp lại các chiến lược (strategy) mà
        nhiều ứng viên KHÁC NHAU đã đưa ra và được duyệt (APPROVED) cho CÙNG 1
        bài toán phỏng vấn.

        INPUT: 1 danh sách các strategy answer, mỗi mục là của 1 ứng viên khác nhau.
        OUTPUT: 1 đoạn tổng hợp bằng tiếng Việt, gộp các hướng tiếp cận giống
        nhau lại thành từng nhóm, mỗi nhóm nêu rõ: ý tưởng cốt lõi, độ phức tạp
        thời gian/không gian (nếu người viết có đề cập hoặc suy ra được), và
        trade-off so với các hướng khác.

        QUY TẮC:
        1. Không bịa thêm hướng tiếp cận không xuất hiện trong input.
        2. Không trích dẫn nguyên văn câu chữ của ứng viên nào, không nhắc tới
           danh tính — luôn diễn giải lại bằng lời của bạn.
        3. Nếu tất cả input đều cùng 1 hướng tiếp cận, chỉ cần nêu hướng đó,
           không cần bịa thêm hướng khác cho có vẻ đa dạng.
        4. Trả về TEXT THUẦN, không dùng markdown (không "**", không "#",
           không bullet "-"/"*") — FE hiện thị nguyên văn, không render markdown.
      `;

// Model 4 (P3 Live Co-Interview) — chấm điểm 2 chiều 1 LẦN duy nhất sau khi
// buổi peer interview kết thúc, input là toàn bộ PeerInterviewMessage[] +
// problemContext. Không liên quan gì tới STRATEGY_SYSTEM_INSTRUCTION (session
// Phase 1/2 bình thường) — đây là model độc lập cho luồng peer-to-peer.
const PEER_INTERVIEW_SYSTEM_INSTRUCTION = `
        Bạn là 1 senior engineering manager, chấm điểm lại 1 buổi phỏng vấn
        peer-to-peer (2 người thật đóng vai candidate và interviewer, không có
        AI tham gia trong lúc phỏng vấn diễn ra).

        INPUT: Toàn bộ đoạn hội thoại (mỗi tin nhắn gắn role CANDIDATE hoặc
        PEER_INTERVIEWER) và ngữ cảnh bài toán được phỏng vấn.
        OUTPUT: Bắt buộc trả về JSON theo đúng định dạng sau:
        {
          "candidate": { "score": 0-100, "feedback": "string" },
          "peerInterviewer": { "score": 0-100, "feedback": "string" }
        }

        TIÊU CHÍ CHẤM:
        1. candidate.score: giải thích ý tưởng có rõ ràng, đúng hướng, xử lý
           được câu hỏi/phản biện của peer interviewer không.
        2. peerInterviewer.score: câu hỏi follow-up có chất lượng, có đào sâu
           đúng chỗ, có dẫn dắt hợp lý không (không chấm điểm dựa trên việc
           candidate đúng hay sai).
        3. Nếu hội thoại quá ngắn để đánh giá đầy đủ 1 trong 2 phía, vẫn phải
           chấm nhưng ghi rõ trong "feedback" rằng dữ liệu còn hạn chế.
        4. Không bịa thêm nội dung không có trong hội thoại.
      `;

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel; // Phase 1 Strategy evaluation, persona "default" (systemPromptExtra rỗng)
  private evaluationModel: GenerativeModel; // For Phase 3 Code evaluation
  private debriefModel: GenerativeModel; // For Offer Debrief digest generation
  private peerInterviewModel: GenerativeModel; // For P3 peer interview 2-way grading

  // Cache model đã build theo personaId — tránh gọi lại Gemini SDK + Prisma
  // mỗi tin nhắn cho cùng 1 persona.
  private readonly personaModelCache = new Map<string, GenerativeModel>();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    );

    // Model 1: Phase 1 Strategy Evaluation
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction: STRATEGY_SYSTEM_INSTRUCTION,
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

    // Model 3: Offer Debrief digest — text tự do, không set responseMimeType
    this.debriefModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: OFFER_DEBRIEF_SYSTEM_INSTRUCTION,
    });

    // Model 4: P3 Peer Interview 2-way grading
    this.peerInterviewModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction: PEER_INTERVIEW_SYSTEM_INSTRUCTION,
    });
  }

  // Không truyền personaId -> dùng `this.model` xây sẵn ở constructor (persona
  // "default"), không tốn thêm round-trip Prisma. Đây là hành vi hiện tại của
  // sessions/chat trước khi Career Journey tích hợp persona thật.
  private async resolveStrategyModel(
    personaId?: string,
  ): Promise<GenerativeModel> {
    if (!personaId) return this.model;

    const cached = this.personaModelCache.get(personaId);
    if (cached) return cached;

    const persona = await this.prisma.interviewerPersona.findUnique({
      where: { id: personaId },
    });

    // Persona không tồn tại/không có systemPromptExtra -> fallback model mặc định,
    // không chặn luồng chat vì lý do dữ liệu persona.
    if (!persona || !persona.systemPromptExtra) {
      return this.model;
    }

    const personaModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction: `${STRATEGY_SYSTEM_INSTRUCTION}\n\n${persona.systemPromptExtra}`,
    });

    this.personaModelCache.set(personaId, personaModel);
    return personaModel;
  }

  async generateResponse(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string,
    problemContext: string,
    personaId?: string,
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
      const model = await this.resolveStrategyModel(personaId);
      const chat = model.startChat({
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

  async generateOfferDebrief(
    strategyAnswers: string[],
    problemContext: string,
  ): Promise<string> {
    const prompt = `
Bài toán:
${problemContext}

Các chiến lược đã được duyệt (mỗi mục là của 1 ứng viên khác nhau):
${strategyAnswers.map((answer, i) => `${i + 1}. ${answer}`).join('\n')}
    `;

    const chat = this.debriefModel.startChat({ history: [] });
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }

  async gradePeerInterview(
    messages: { role: 'CANDIDATE' | 'PEER_INTERVIEWER'; content: string }[],
    problemContext: string,
  ): Promise<{
    candidateScore: number;
    candidateFeedback: string;
    peerInterviewerScore: number;
    peerInterviewerFeedback: string;
  }> {
    const transcript = messages
      .map((m) => `[${m.role}] ${m.content}`)
      .join('\n');

    const prompt = `
Bài toán:
${problemContext}

Đoạn hội thoại (theo thứ tự thời gian):
${transcript}
    `;

    const chat = this.peerInterviewModel.startChat({ history: [] });
    const result = await chat.sendMessage(prompt);
    const rawResponse = result.response.text();

    const parsed = JSON.parse(rawResponse) as {
      candidate?: { score?: unknown; feedback?: unknown };
      peerInterviewer?: { score?: unknown; feedback?: unknown };
    };

    if (
      typeof parsed.candidate?.score !== 'number' ||
      typeof parsed.peerInterviewer?.score !== 'number'
    ) {
      throw new Error('Invalid peer interview grading structure from AI');
    }

    return {
      candidateScore: parsed.candidate.score,
      candidateFeedback:
        typeof parsed.candidate.feedback === 'string'
          ? parsed.candidate.feedback
          : '',
      peerInterviewerScore: parsed.peerInterviewer.score,
      peerInterviewerFeedback:
        typeof parsed.peerInterviewer.feedback === 'string'
          ? parsed.peerInterviewer.feedback
          : '',
    };
  }
}
