import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProblems } from "@/features/problems/hooks/use-problems";
import { useCreatePeerInterview } from "../hooks/use-create-peer-interview";
import { useJoinPeerInterview } from "../hooks/use-join-peer-interview";

export function PeerInterviewLobbyPage() {
  const { t } = useTranslation("peerInterview");
  const navigate = useNavigate();
  const { data: problems, isLoading: problemsLoading } = useProblems();
  const createPeerInterview = useCreatePeerInterview();
  const joinPeerInterview = useJoinPeerInterview();

  const [problemId, setProblemId] = useState<string>("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = () => {
    if (!problemId) return;
    createPeerInterview.mutate(problemId, {
      onSuccess: (session) => navigate(`/peer-interview/${session.id}`),
    });
  };

  const handleJoin = () => {
    if (!inviteCode.trim()) return;
    joinPeerInterview.mutate(inviteCode.trim().toUpperCase(), {
      onSuccess: (session) => navigate(`/peer-interview/${session.id}`),
    });
  };

  return (
    <div className="w-full pb-10 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("create.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("create.description")}</p>
          {problemsLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={problemId} onValueChange={setProblemId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("create.problemPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {problems?.map((problem) => (
                  <SelectItem key={problem.id} value={problem.id}>
                    {problem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={handleCreate}
            disabled={!problemId || createPeerInterview.isPending}
          >
            {t("create.submit")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("join.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("join.description")}</p>
          <div className="space-y-1.5">
            <Label htmlFor="invite-code">{t("join.inviteCodeLabel")}</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder={t("join.inviteCodePlaceholder")}
              className="uppercase"
              maxLength={8}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleJoin}
            disabled={!inviteCode.trim() || joinPeerInterview.isPending}
          >
            {t("join.submit")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
