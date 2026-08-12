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
import { AdminAuditLogEntry } from "../types";

const ACTION_BADGE_CLASS: Record<string, string> = {
  CREATE: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  UPDATE: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
};

function actionBadgeClass(action: string) {
  const prefix = action.split("_")[0];
  return ACTION_BADGE_CLASS[prefix] ?? "bg-muted text-muted-foreground border-border";
}

interface AdminAuditLogTableProps {
  entries?: AdminAuditLogEntry[];
  isLoading: boolean;
  isError: boolean;
}

export function AdminAuditLogTable({ entries, isLoading, isError }: AdminAuditLogTableProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">{t("auditLog.columnAdmin")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("auditLog.columnAction")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("auditLog.columnTarget")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("auditLog.columnCreatedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={4}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell colSpan={4} className="h-32 text-center text-destructive">
                {t("auditLog.loadError")}
              </TableCell>
            </TableRow>
          ) : entries?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                {t("auditLog.empty")}
              </TableCell>
            </TableRow>
          ) : (
            entries?.map((entry) => (
              <TableRow key={entry.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="font-medium text-foreground">{entry.admin.name}</div>
                  <div className="text-xs text-muted-foreground">{entry.admin.email}</div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("shrink-0 font-mono", actionBadgeClass(entry.action))}>
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {entry.targetType} · {entry.targetId.slice(0, 8)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(entry.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
