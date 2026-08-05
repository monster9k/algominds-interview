import { ProfileInfoCard } from "../components/profile-info-card";
import { SolvedStatsCard } from "../components/solved-stats-card";
import { BadgesCard } from "../components/badges-card";
import { SubmissionHeatmap } from "../components/submission-heatmap";
import { RecentSubmissionsCard } from "../components/recent-submissions-card";
import { QuestHistoryCard } from "../components/quest-history-card";

export function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        <div>
          <ProfileInfoCard />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-stretch">
            <SolvedStatsCard />
            <BadgesCard />
          </div>
          <SubmissionHeatmap />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <RecentSubmissionsCard />
            <QuestHistoryCard />
          </div>
        </div>
      </div>
    </div>
  );
}
