export interface AdminStats {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isPro: boolean;
  createdAt: string;
}

// Full BugSnippet fields — unlike GET /quest/snippets (gameplay), this
// includes buggyLine/explanation since the admin is meant to see them.
export interface AdminQuestSnippet {
  id: string;
  language: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  code: string;
  buggyLine: number;
  explanation: string | null;
  isActive: boolean;
  createdAt: string;
}
