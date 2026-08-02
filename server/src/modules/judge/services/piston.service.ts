import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isAxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';

export interface ExecutionResult {
  output: string;
  error: string | null;
  timeMs?: number | null;
  memoryKb?: number | null;
}

// Shape of a single compile/run stage in Piston's response. Verified live
// against the image actually running in docker-compose (ghcr.io/engineer-man/piston)
// via a direct POST /api/v2/execute call: it returns `wall_time`/`cpu_time`
// in milliseconds and `memory` in BYTES — NOT `time` (seconds) as an earlier
// version of this file assumed for a hypothetical custom build. `time` is
// kept as a last-resort fallback only in case a differently-configured
// Piston instance sends it, but is treated the same unit as wall_time (ms).
interface PistonStageResult {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number;
  signal?: string | null;
  wall_time?: number | string;
  cpu_time?: number | string;
  time?: number | string;
  memory?: number | string;
}

interface PistonExecuteResponse {
  language?: string;
  version?: string;
  compile?: PistonStageResult;
  run?: PistonStageResult;
}

// Piston error responses (e.g. unsupported runtime/version) — shape is
// {message: string} per Piston's API docs, but not all error paths are
// guaranteed to match, hence the fallback chain where this is used.
interface PistonErrorResponse {
  message?: string;
  error?: string;
}

@Injectable()
export class PistonService {
  private readonly pistonApiUrl: string;
  private readonly logger = new Logger(PistonService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.pistonApiUrl = this.configService.getOrThrow<string>('PISTON_API_URL');
  }

  async execute(
    language: string,
    code: string,
    stdin?: string,
    limits?: { timeLimitMs?: number; memoryLimitMb?: number },
  ): Promise<ExecutionResult> {
    const config = this.getLanguageConfig(language);

    const payload: Record<string, unknown> = {
      language: config.language,
      version: config.version,
      files: [{ name: config.fileName, content: code }],
    };

    if (stdin !== undefined) {
      payload.stdin = stdin;
    }

    // Đề bài có timeLimitMs/memoryLimitMb riêng — nếu không truyền, mọi bài
    // đều chạy theo giới hạn mặc định của Piston thay vì theo đề.
    if (limits?.timeLimitMs) {
      payload.run_timeout = limits.timeLimitMs;
    }
    if (limits?.memoryLimitMb) {
      payload.run_memory_limit = limits.memoryLimitMb * 1024 * 1024;
    }

    // Piston needs an explicit `main` class for Java, otherwise it defaults
    // to executing the first public class it finds (Solution, not Main).
    if (config.language === 'java') {
      payload.main = 'Main';
    }

    this.logger.log(`PISTON PAYLOAD:\n${JSON.stringify(payload, null, 2)}`);

    try {
      const response = await lastValueFrom(
        this.httpService.post<PistonExecuteResponse>(
          this.pistonApiUrl,
          payload,
        ),
      );

      const compile = response.data?.compile;
      const run = response.data?.run;

      // Compilation failure (languages like Java, C++ emit a compile stage)
      if (compile && compile.code !== 0) {
        this.logger.warn('Piston compilation failed', {
          stderr: compile.stderr,
          code: compile.code,
        });
        return {
          output: '',
          error: compile.stderr || compile.output || 'Compilation failed',
          timeMs: null,
          memoryKb: null,
        };
      }

      if (!run) {
        this.logger.error('Piston response missing run stage', {
          data: JSON.stringify(response.data),
        });
        return {
          output: '',
          error: 'Execution engine returned no run result',
          timeMs: null,
          memoryKb: null,
        };
      }

      // Runtime error (non-zero exit code from the run stage) — vẫn parse
      // time/memory ở đây vì 1 process bị kill do vượt run_timeout/run_memory_limit
      // cũng đi qua nhánh này; JudgeService cần 2 số liệu này để phân biệt
      // TLE/MLE với lỗi runtime thông thường.
      if (run.code !== 0 && run.stderr) {
        return {
          output: run.stdout ?? '',
          error: run.stderr,
          ...this.parseStageMetrics(run),
        };
      }

      return {
        output: run.stdout ?? '',
        error: run.stderr || null,
        ...this.parseStageMetrics(run),
      };
    } catch (error: unknown) {
      if (isAxiosError<PistonErrorResponse>(error) && error.response) {
        this.logger.error('Piston API returned an error response', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        });

        const pistonMessage: string =
          error.response.data?.message ??
          error.response.data?.error ??
          JSON.stringify(error.response.data);

        return {
          output: '',
          error: `Piston Error [${error.response.status}]: ${pistonMessage}`,
          timeMs: null,
          memoryKb: null,
        };
      }

      // Network-level failure (ECONNREFUSED, timeout, etc.)
      const errorCode = isAxiosError(error) ? error.code : undefined;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('Piston unreachable', {
        code: errorCode,
        message: errorMessage,
      });

      return {
        output: '',
        error: `Piston unreachable: ${errorCode ?? errorMessage}`,
        timeMs: null,
        memoryKb: null,
      };
    }
  }

  // Parse wall_time (đã là ms) / memory (byte -> kb) từ 1 stage result của
  // Piston. Dùng chung cho cả nhánh success và runtime-error vì cả 2 đều cần
  // time/memory để JudgeService so sánh với timeLimitMs/memoryLimitMb (phát
  // hiện TLE/MLE).
  private parseStageMetrics(stage: PistonStageResult): {
    timeMs: number | null;
    memoryKb: number | null;
  } {
    const rawTime = stage.wall_time ?? stage.cpu_time ?? stage.time;
    const rawMemory = stage.memory;
    const timeMs =
      typeof rawTime === 'number'
        ? Math.round(rawTime)
        : rawTime
          ? Math.round(Number(rawTime))
          : null;
    const memoryKb =
      typeof rawMemory === 'number'
        ? Math.round(rawMemory / 1024)
        : rawMemory
          ? Math.round(Number(rawMemory) / 1024)
          : null;

    return { timeMs, memoryKb };
  }

  private getLanguageConfig(language: string): {
    language: string;
    version: string;
    fileName: string;
  } {
    const langMap: Record<
      string,
      { language: string; version: string; fileName: string }
    > = {
      typescript: {
        language: 'typescript',
        version: '5.0.3',
        fileName: 'solution.ts',
      },
      javascript: {
        language: 'node',
        version: '20.11.1',
        fileName: 'solution.js',
      },
      node: { language: 'node', version: '20.11.1', fileName: 'solution.js' },
      python: {
        language: 'python',
        version: '3.12.0',
        fileName: 'solution.py',
      },
      cpp: { language: 'c++', version: '10.2.0', fileName: 'solution.cpp' },
      'c++': { language: 'c++', version: '10.2.0', fileName: 'solution.cpp' },
      c: { language: 'c', version: '10.2.0', fileName: 'solution.c' },
      java: { language: 'java', version: '15.0.2', fileName: 'Main.java' },
    };
    return langMap[language] ?? langMap['node'];
  }
}
