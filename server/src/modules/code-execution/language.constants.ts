// Phải khớp với các key trong PistonService.getLanguageConfig() — ngôn ngữ lạ
// sẽ bị chặn ở DTO validation thay vì fallback âm thầm về "node".
export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'node',
  'python',
  'cpp',
  'c++',
  'c',
  'java',
] as const;
