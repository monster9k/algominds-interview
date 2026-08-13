import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminCareerTable } from "../components/admin-career-table";
import { CareerTrackFormDialog } from "../components/career-track-form-dialog";
import { AdminCareerTrack } from "../types";

export function AdminCareerPage() {
  const { t } = useTranslation("admin");

  const [formOpen, setFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<AdminCareerTrack | undefined>(undefined);

  const openCreate = () => {
    setEditingTrack(undefined);
    setFormOpen(true);
  };
  const openEdit = (track: AdminCareerTrack) => {
    setEditingTrack(track);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {t("career.title")}
          </h1>
          <Button className="h-9 rounded-full" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("career.createNew")}
          </Button>
        </div>

        <AdminCareerTable onEdit={openEdit} />
      </div>

      <CareerTrackFormDialog open={formOpen} onOpenChange={setFormOpen} track={editingTrack} />
    </div>
  );
}
