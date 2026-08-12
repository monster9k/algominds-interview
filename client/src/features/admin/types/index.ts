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
