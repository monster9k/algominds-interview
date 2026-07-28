import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

export interface ExecutionResult {
  output: string;
  error: string | null;
  timeMs?: number | null;
  memoryKb?: number | null;
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

    // Piston needs an explicit `main` class for Java, otherwise it defaults
    // to executing the first public class it finds (Solution, not Main).
    if (config.language === 'java') {
      payload.main = 'Main';
    }

    this.logger.log(`PISTON PAYLOAD:\n${JSON.stringify(payload, null, 2)}`);

    try {
      const response = await lastValueFrom(
        this.httpService.post(this.pistonApiUrl, payload),
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

      // Runtime error (non-zero exit code from the run stage)
      if (run.code !== 0 && run.stderr) {
        return {
          output: run.stdout ?? '',
          error: run.stderr,
          timeMs: null,
          memoryKb: null,
        };
      }

      const rawTime = run.time;
      const rawMemory = run.memory;
      const timeMs =
        typeof rawTime === 'number'
          ? Math.round(rawTime * 1000)
          : rawTime
            ? Math.round(Number(rawTime) * 1000)
            : null;
      const memoryKb =
        typeof rawMemory === 'number'
          ? Math.round(rawMemory)
          : rawMemory
            ? Math.round(Number(rawMemory))
            : null;

      return {
        output: run.stdout ?? '',
        error: run.stderr || null,
        timeMs,
        memoryKb,
      };
    } catch (error: any) {
      const isAxiosError = !!error.response;

      if (isAxiosError) {
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
      this.logger.error('Piston unreachable', {
        code: error.code,
        message: error.message,
      });

      return {
        output: '',
        error: `Piston unreachable: ${error.code ?? error.message}`,
        timeMs: null,
        memoryKb: null,
      };
    }
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
