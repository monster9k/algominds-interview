import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminQuestsTable } from "../components/admin-quests-table";
import { BugSnippetFormDialog } from "../components/bug-snippet-form-dialog";
import { AdminQuestSnippet } from "../types";

export function AdminQuestsPage() {
  const { t } = useTranslation("admin");

  const [formOpen, setFormOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<AdminQuestSnippet | undefined>(undefined);

  const openCreate = () => {
    setEditingSnippet(undefined);
    setFormOpen(true);
  };
  const openEdit = (snippet: AdminQuestSnippet) => {
    setEditingSnippet(snippet);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {t("quests.title")}
          </h1>
          <Button className="h-9 rounded-full" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("quests.createNew")}
          </Button>
        </div>

        <AdminQuestsTable onEdit={openEdit} />
      </div>

      <BugSnippetFormDialog open={formOpen} onOpenChange={setFormOpen} snippet={editingSnippet} />
    </div>
  );
}
