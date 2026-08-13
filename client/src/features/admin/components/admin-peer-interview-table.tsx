import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OctagonX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminPeerInterviews } from "../hooks/use-admin-peer-interviews";
import { useForceAbandonPeerInterview } from "../hooks/use-force-abandon-peer-interview";
import { AdminPeerInterviewStatus } from "../types";
import { ConfirmDialog } from "./confirm-dialog";

const STATUS_DOT_CLASS: Record<AdminPeerInterviewStatus, string> = {
  WAITING_FOR_PEER: "bg-blue-500",
  ACTIVE: "bg-emerald-500",
  COMPLETED: "bg-muted-foreground/50",
  ABANDONED: "bg-red-500",
};

const STATUS_TEXT_CLASS: Record<AdminPeerInterviewStatus, string> = {
  WAITING_FOR_PEER: "text-blue-500",
  ACTIVE: "text-emerald-500",
  COMPLETED: "text-muted-foreground",
  ABANDONED: "text-red-500",
};

const STATUS_LABEL_KEY: Record<AdminPeerInterviewStatus, string> = {
  WAITING_FOR_PEER: "peerInterview.statusWaitingForPeer",
  ACTIVE: "peerInterview.statusActive",
  COMPLETED: "peerInterview.statusCompleted",
  ABANDONED: "peerInterview.statusAbandoned",
};

// Chỉ cho force-abandon khi session chưa ở trạng thái cuối — khớp đúng điều
// kiện chặn 400 ở peer-interview.service.ts#forceAbandon().
const TERMINAL_STATUSES: AdminPeerInterviewStatus[] = ["COMPLETED", "ABANDONED"];

export function AdminPeerInterviewTable() {
  const { t } = useTranslation("admin");
  const { data: sessions, isLoading, isError } = useAdminPeerInterviews();
  const forceAbandon = useForceAbandonPeerInterview();
  const [abandoningId, setAbandoningId] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("peerInterview.columnId")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("peerInterview.columnCandidate")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("peerInterview.columnInterviewer")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("peerInterview.columnProblem")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("peerInterview.columnStatus")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("peerInterview.columnStartedAt")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={7} className="py-2.5">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={7}
                className="h-32 text-center text-destructive"
              >
                {t("peerInterview.loadError")}
              </TableCell>
            </TableRow>
          ) : sessions?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={7}
                className="h-32 text-center text-muted-foreground"
              >
                {t("peerInterview.empty")}
              </TableCell>
            </TableRow>
          ) : (
            sessions?.map((session) => (
              <TableRow
                key={session.id}
                className="border-0 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="py-2.5 text-muted-foreground text-xs font-mono align-middle">
                  {session.id.slice(0, 8)}
                </TableCell>
                <TableCell className="py-2.5 text-foreground align-middle">
                  {session.candidate.name}
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
                  {session.peerInterviewer?.name ?? t("peerInterview.waiting")}
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
                  {session.problem.title}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        STATUS_DOT_CLASS[session.status],
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        STATUS_TEXT_CLASS[session.status],
                      )}
                    >
                      {t(STATUS_LABEL_KEY[session.status])}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
                  {new Date(session.startedAt).toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 px-2 align-middle">
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title={t("peerInterview.forceAbandonAction")}
                      onClick={() => setAbandoningId(session.id)}
                      disabled={TERMINAL_STATUSES.includes(session.status)}
                    >
                      <OctagonX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!abandoningId}
        onOpenChange={(open) => !open && setAbandoningId(null)}
        title={t("peerInterview.forceAbandonConfirmTitle")}
        description={t("peerInterview.forceAbandonConfirmDescription")}
        isLoading={forceAbandon.isPending}
        onConfirm={() => {
          if (!abandoningId) return;
          forceAbandon.mutate(abandoningId, {
            onSuccess: () => setAbandoningId(null),
          });
        }}
      />
    </div>
  );
}
