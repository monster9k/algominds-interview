import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
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
import { useAdminCareerTracks } from "../hooks/use-admin-career-tracks";
import { useDeleteCareerTrack } from "../hooks/use-delete-career-track";
import { AdminCareerTrack } from "../types";
import { ConfirmDialog } from "./confirm-dialog";

interface AdminCareerTableProps {
  onEdit: (track: AdminCareerTrack) => void;
}

export function AdminCareerTable({ onEdit }: AdminCareerTableProps) {
  const { t } = useTranslation("admin");
  const { data: tracks, isLoading, isError } = useAdminCareerTracks();
  const deleteTrack = useDeleteCareerTrack();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
            <TableHead className="h-11 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={5} className="py-2.5">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
                className="h-32 text-center text-destructive"
              >
                {t("career.loadError")}
              </TableCell>
            </TableRow>
          ) : tracks?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
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
                <TableCell className="py-2.5 px-2 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(track)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(track.id)}
                      disabled={!track.isActive}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t("career.deleteConfirmTitle")}
        description={t("career.deleteConfirmDescription")}
        isLoading={deleteTrack.isPending}
        onConfirm={() => {
          if (!deletingId) return;
          deleteTrack.mutate(deletingId, {
            onSuccess: () => setDeletingId(null),
          });
        }}
      />
    </div>
  );
}
