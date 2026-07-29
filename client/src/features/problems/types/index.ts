export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProblemStatus = "Solved" | "Attempted" | "Todo" | null;
export type SortDirection = "asc" | "desc";

//Type cho Tag (do Backend trả về include: { tag: true })
export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface ProblemTagResponse {
  tag: Tag;
}

export interface Problem {
  id: string;
  displayId: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  acceptance?: string;
  status?: ProblemStatus;
  tags: ProblemTagResponse[];
  hasSolution: boolean;
}

// Params dùng để filter danh sách problems (query params gửi lên GET /problems)
export interface ProblemFilterParams {
  difficulty?: Difficulty;
  tags?: string[];
  search?: string;
  status?: NonNullable<ProblemStatus>;
  sortDirection?: SortDirection;
}
