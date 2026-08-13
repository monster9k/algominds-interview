import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AdminAuditLogEntry } from "../types";

const ACTION_DOT_CLASS: Record<string, string> = {
  CREATE: "bg-teal-500",
  UPDATE: "bg-yellow-500",
  DELETE: "bg-red-500",
};

const ACTION_TEXT_CLASS: Record<string, string> = {
  CREATE: "text-teal-500",
  UPDATE: "text-yellow-500",
  DELETE: "text-red-500",
};

function actionDotClass(action: string) {
  const prefix = action.split("_")[0];
  return ACTION_DOT_CLASS[prefix] ?? "bg-muted-foreground/50";
}

function actionTextClass(action: string) {
  const prefix = action.split("_")[0];
  return ACTION_TEXT_CLASS[prefix] ?? "text-muted-foreground";
}

interface AdminAuditLogTableProps {
  entries?: AdminAuditLogEntry[];
  isLoading: boolean;
  isError: boolean;
}

export function AdminAuditLogTable({
  entries,
  isLoading,
  isError,
}: AdminAuditLogTableProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("auditLog.columnAdmin")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("auditLog.columnAction")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("auditLog.columnTarget")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("auditLog.columnCreatedAt")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={4} className="py-2.5">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={4}
                className="h-32 text-center text-destructive"
              >
                {t("auditLog.loadError")}
              </TableCell>
            </TableRow>
          ) : entries?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={4}
                className="h-32 text-center text-muted-foreground"
              >
                {t("auditLog.empty")}
              </TableCell>
            </TableRow>
          ) : (
            entries?.map((entry) => (
              <TableRow
                key={entry.id}
                className="border-0 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="py-2.5 align-middle">
                  <div className="font-medium text-foreground">
                    {entry.admin.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.admin.email}
                  </div>
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        actionDotClass(entry.action),
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium font-mono",
                        actionTextClass(entry.action),
                      )}
                    >
                      {entry.action}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs font-mono align-middle">
                  {entry.targetType} · {entry.targetId.slice(0, 8)}
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
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
