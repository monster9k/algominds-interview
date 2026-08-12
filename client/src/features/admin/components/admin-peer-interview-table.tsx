import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminPeerInterviews } from "../hooks/use-admin-peer-interviews";
import { AdminPeerInterviewStatus } from "../types";

const STATUS_BADGE_CLASS: Record<AdminPeerInterviewStatus, string> = {
  WAITING_FOR_PEER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  COMPLETED: "bg-muted text-muted-foreground border-border",
  ABANDONED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const STATUS_LABEL_KEY: Record<AdminPeerInterviewStatus, string> = {
  WAITING_FOR_PEER: "peerInterview.statusWaitingForPeer",
  ACTIVE: "peerInterview.statusActive",
  COMPLETED: "peerInterview.statusCompleted",
  ABANDONED: "peerInterview.statusAbandoned",
};

export function AdminPeerInterviewTable() {
  const { t } = useTranslation("admin");
  const { data: sessions, isLoading, isError } = useAdminPeerInterviews();

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">{t("peerInterview.columnId")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("peerInterview.columnCandidate")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("peerInterview.columnInterviewer")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("peerInterview.columnProblem")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("peerInterview.columnStatus")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("peerInterview.columnStartedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell colSpan={6} className="h-32 text-center text-destructive">
                {t("peerInterview.loadError")}
              </TableCell>
            </TableRow>
          ) : sessions?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                {t("peerInterview.empty")}
              </TableCell>
            </TableRow>
          ) : (
            sessions?.map((session) => (
              <TableRow key={session.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {session.id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-foreground">{session.candidate.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {session.peerInterviewer?.name ?? t("peerInterview.waiting")}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{session.problem.title}</TableCell>
                <TableCell>
                  <Badge className={cn("shrink-0", STATUS_BADGE_CLASS[session.status])}>
                    {t(STATUS_LABEL_KEY[session.status])}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(session.startedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
