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

  async execute(language: string, code: string): Promise<ExecutionResult> {
    const config = this.getLanguageConfig(language);

    const payload = {
      language: config.language,
      version: config.version,
      files: [{ content: code }],
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(this.pistonApiUrl, payload),
      );

      const run = response.data?.run;
      const rawTime = run?.time;
      const rawMemory = run?.memory;
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
        output: run.stdout ? run.stdout : '',
        error: run.stderr ? run.stderr : null,
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

  private getLanguageConfig(language: string) {
    const langMap = {
      typescript: { language: 'typescript', version: '5.0.3' },
      javascript: { language: 'node', version: '20.11.1' },
      node: { language: 'node', version: '20.11.1' },
      python: { language: 'python', version: '3.12.0' },
      cpp: { language: 'c++', version: '10.2.0' },
      'c++': { language: 'c++', version: '10.2.0' },
      c: { language: 'c', version: '10.2.0' },
    };
    return langMap[language] || langMap['node'];
  }
}
