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
import { useCareerTracks } from "@/features/career/hooks/use-career-tracks";

export function AdminCareerTable() {
  const { t } = useTranslation("admin");
  const { data: tracks, isLoading, isError } = useCareerTracks();

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("career.columnId")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("career.columnName")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("career.columnCompany")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("career.columnStatus")}
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
                {t("career.loadError")}
              </TableCell>
            </TableRow>
          ) : tracks?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={4}
                className="h-32 text-center text-muted-foreground"
              >
                {t("career.empty")}
              </TableCell>
            </TableRow>
          ) : (
            tracks?.map((track) => (
              <TableRow
                key={track.id}
                className="border-0 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="py-2.5 text-muted-foreground text-xs font-mono align-middle">
                  {track.id.slice(0, 8)}
                </TableCell>
                <TableCell className="py-2.5 font-medium text-foreground align-middle">
                  {track.name}
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
                  {track.company?.name ?? t("career.companyGeneric")}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        track.isActive
                          ? "bg-teal-500"
                          : "bg-muted-foreground/50",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        track.isActive
                          ? "text-teal-500"
                          : "text-muted-foreground",
                      )}
                    >
                      {track.isActive
                        ? t("career.statusActive")
                        : t("career.statusInactive")}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
