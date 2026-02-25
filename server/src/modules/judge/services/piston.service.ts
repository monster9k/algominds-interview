import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

export interface ExecutionResult {
  output: string;
  error: string | null;
}

@Injectable()
export class PistonService {
  private readonly PISTON_API = 'http://localhost:2000/api/v2/execute';
  private readonly logger = new Logger(PistonService.name);

  constructor(private httpService: HttpService) {}

  async execute(language: string, code: string): Promise<ExecutionResult> {
    const config = this.getLanguageConfig(language);

    const payload = {
      language: config.language,
      version: config.version,
      files: [{ content: code }],
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(this.PISTON_API, payload),
      );

      const run = response.data.run;
      return {
        output: run.stdout ? run.stdout : '',
        error: run.stderr ? run.stderr : null,
      };
    } catch (error) {
      this.logger.error('Piston Execution Failed', {
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        output: '',
        error: 'Execution Engine Error (Rate Limit or Sandbox Down)',
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
