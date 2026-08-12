import { useTranslation } from "react-i18next";
import { AdminQuestsTable } from "../components/admin-quests-table";

export function AdminQuestsPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("quests.title")}</h1>
      <AdminQuestsTable />
    </div>
  );
}
