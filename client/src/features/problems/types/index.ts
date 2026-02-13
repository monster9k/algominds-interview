export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProblemStatus = "Solved" | "Attempted" | "Todo";

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
  title: string;
  slug: string;
  difficulty: Difficulty;
  acceptance?: number;
  status?: ProblemStatus;
  tags: ProblemTagResponse[];
}
