import { useTranslation } from "react-i18next";
import { AdminQuestsTable } from "../components/admin-quests-table";

export function AdminQuestsPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {t("quests.title")}
        </h1>
        <AdminQuestsTable />
      </div>
    </div>
  );
}
