import { useTranslation } from "react-i18next";
import { AdminCareerTable } from "../components/admin-career-table";

export function AdminCareerPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("career.title")}</h1>
      <AdminCareerTable />
    </div>
  );
}
