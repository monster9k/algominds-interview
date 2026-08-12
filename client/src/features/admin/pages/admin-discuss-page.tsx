import { useTranslation } from "react-i18next";
import { AdminDiscussTable } from "../components/admin-discuss-table";

export function AdminDiscussPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("discuss.title")}</h1>
      <AdminDiscussTable />
    </div>
  );
}
