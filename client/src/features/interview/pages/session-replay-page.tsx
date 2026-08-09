import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionReplay } from "../hooks/use-session-replay";
import { MessageBubble } from "../components/console-panel/message-bubble";
import { AIEvaluationSection } from "../components/problem-panel/ai-evaluation-section";

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD: "text-rose-400",
};

export function SessionReplayPage() {
  const { t } = useTranslation("interview");
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: replay, isLoading, isError } = useSessionReplay(sessionId);

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <History className="h-5 w-5 text-primary" />
        <h1 className="text-sm font-semibold text-foreground">
          {t("replay.title")}
        </h1>
        {replay && (
          <span className="text-sm text-muted-foreground">
            — {replay.session.problem.displayId}. {replay.session.problem.title}{" "}
            <span
              className={DIFFICULTY_COLOR[replay.session.problem.difficulty]}
            >
              {replay.session.problem.difficulty}
            </span>
          </span>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-rose-400">{t("replay.loadFailed")}</p>
        )}

        {replay && replay.timeline.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("replay.empty")}</p>
        )}

        {replay && replay.timeline.length > 0 && (
          <div className="space-y-4">
            {replay.timeline.map((entry, index) => {
              if (entry.type === "EVALUATION") {
                return (
                  <AIEvaluationSection
                    key={`evaluation-${index}`}
                    evaluation={{
                      scores: entry.scores,
                      feedback: entry.feedback ?? "",
                      pros: entry.pros,
                      cons: entry.cons,
                    }}
                  />
                );
              }

              return (
                <div key={`message-${index}`} className="space-y-1">
                  {entry.flagged && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t("replay.flagged")}
                    </p>
                  )}
                  <MessageBubble
                    sender={entry.sender}
                    content={entry.content}
                    flagged={entry.flagged}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
