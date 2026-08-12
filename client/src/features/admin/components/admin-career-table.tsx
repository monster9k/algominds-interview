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
import { useCareerTracks } from "@/features/career/hooks/use-career-tracks";

export function AdminCareerTable() {
  const { t } = useTranslation("admin");
  const { data: tracks, isLoading, isError } = useCareerTracks();

  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("career.columnId")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("career.columnName")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("career.columnCompany")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("career.columnStatus")}</TableHead>
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
                {t("career.loadError")}
              </TableCell>
            </TableRow>
          ) : tracks?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                {t("career.empty")}
              </TableCell>
            </TableRow>
          ) : (
            tracks?.map((track) => (
              <TableRow key={track.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {track.id.slice(0, 8)}
                </TableCell>
                <TableCell className="font-medium text-foreground">{track.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {track.company?.name ?? t("career.companyGeneric")}
                </TableCell>
                <TableCell>
                  <Badge variant={track.isActive ? "default" : "outline"}>
                    {track.isActive ? t("career.statusActive") : t("career.statusInactive")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
