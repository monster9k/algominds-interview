// Problem.testCases is a Prisma JSON blob (see schema.prisma) — this is the
// shape each entry is expected to have. input/output stay `unknown` since
// their actual shape varies per-problem (see CodeGeneratorService).
export interface TestCase {
  input: unknown;
  output: unknown;
}
