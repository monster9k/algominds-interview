import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JudgeService {
  private readonly PISTON_API = 'https://emkc.org/api/v2/piston/execute';

  constructor(
    private httpService: HttpService,
    private prismaService: PrismaService,
  ) {}
  async submitCode(
    userId: string,
    sessionId: string,
    code: string,
    language: string,
  ) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      include: { problem: true },
    });

    if (!session) {
      throw new NotFoundException('Session không tồn tại');
    }

    // Parse Test Cases từ JSON
    const testCases = session.problem.testCases as any[];
    if (!testCases || testCases.length === 0) {
      throw new NotFoundException('Bài tập chưa có test case');
    }

    let passedTests = 0;
    let firstErrorStatus: SubmissionStatus | null = null;
    const testCaseResults: {
      testCaseId: any;
      status: SubmissionStatus;
      actualOutput: any;
      errorMessage: any;
    }[] = [];

    for (const testCase of testCases) {
      const input = testCase.input;
      const expectedOutput = testCase.output;

      const runnableCode = this.prepareRunnableCode(language, code, input);
      //   console.log('Runnable Code:', runnableCode);
      const result = await this.executeWithPiston(language, runnableCode);
      console.log('Check Result Response:', result);
      let status: SubmissionStatus = SubmissionStatus.ACCEPTED;

      if (result.error) {
        status = SubmissionStatus.RUNTIME_ERROR;
        if (result.output.includes('SyntaxError')) {
          status = SubmissionStatus.COMPILE_ERROR;
        }
      } else {
        // so sánh output (Trim khoảng trắng và xuống dòng)
        const actualOutput = result.output.trim();
        const expectedString = JSON.stringify(expectedOutput).trim();

        if (
          actualOutput !== expectedString &&
          actualOutput !== String(expectedOutput)
        ) {
          status = SubmissionStatus.WRONG_ANSWER;
        }
      }

      //  Lưu kết quả của Test Case này
      testCaseResults.push({
        testCaseId: testCase.id,
        status,
        actualOutput: result.output,
        errorMessage: result.error,
      });

      if (status === SubmissionStatus.ACCEPTED) {
        passedTests += 1;
      } else if (!firstErrorStatus) {
        firstErrorStatus = status;
      }
    }

    // Tổng kết kết  quả
    const finalStatus =
      passedTests === testCases.length
        ? SubmissionStatus.ACCEPTED
        : firstErrorStatus || SubmissionStatus.WRONG_ANSWER;

    // lưu submission vào db
    const submission = await this.prismaService.submission.create({
      data: {
        sessionId,
        code,
        language,
        status: finalStatus,
        passedTests,
        totalTests: testCases.length,
        testCaseResults: testCaseResults, // Lưu chi tiết để frontend hiển thị
      },
    });

    // Nếu Accepted -> Update Session thành Completed (Tùy logic)
    /* if (finalStatus === SubmissionStatus.ACCEPTED) {
         await this.prisma.session.update({ ... });
       } */

    return submission;
  }

  // hàm gọi piston api
  private async executeWithPiston(language: string, code: string) {
    // Map ngôn ngữ của mình sang ngôn ngữ Piston hiểu
    try {
      const langMap = {
        typescript: 'typescript',
        javascript: 'javascript',
        python: 'python',
      };
      const versionMap = {
        typescript: '5.0.3',
        javascript: '18.15.0',
        python: '3.10.0',
      };

      const payload = {
        language: langMap[language] || 'javascript',
        version: versionMap[language] || '18.15.0',
        files: [{ content: code }],
      };

      //     Vì this.httpService.post() KHÔNG trả về Promise
      //  Nó trả về Observable
      // await KHÔNG dùng trực tiếp với Observable
      //  lastValueFrom() dùng để chuyển Observable → Promise
      const response = await lastValueFrom(
        this.httpService.post(this.PISTON_API, payload),
      );
      const run = response.data.run;
      return {
        output: run.stdout ? run.stdout : '',
        error: run.stderr ? run.stderr : null, // Nếu có stderr tức là lỗi
      };
    } catch (error) {
      console.error('Piston Error:', error);
      return { output: '', error: 'Execution Engine Error' };
    }
  }

  // TẠO DRIVER CODE (QUAN TRỌNG)
  // Mục tiêu: Thêm đoạn code gọi hàm và in kết quả ra Console để ta lấy được Output
  private prepareRunnableCode(
    language: string,
    userCode: string,
    input: any,
  ): string {
    // TODO: Implement the logic to prepare runnable code
    if (language === 'typescript' || language === 'javascript') {
      const args = Object.values(input)
        .map((val) => JSON.stringify(val))
        .join(', ');

      // demo harcode isValid
      return `
        ${userCode}
        // --- DRIVER CODE (SYSTEM GENERATED) ---
        try {
           // Tìm tên hàm (Cách đơn giản: Bài Valid Parentheses hàm là isValid)
           // Để dynamic, ta cần lưu functionName trong DB Problem.
           // Tạm thời mình giả định hàm tên là "isValid" (cho bài Valid Parentheses)
           // Hoặc "maxProfit" (cho bài Stock)
           
           let result;
           if (typeof isValid !== 'undefined') {
              result = isValid(${args});
           } else if (typeof maxProfit !== 'undefined') {
              result = maxProfit(${args});
           } else {
              console.log("Function not found");
           }
           console.log(JSON.stringify(result));
        } catch (e) {
           console.error(e);
        }
      `;
    }
    return userCode;
  }
}
