import { useTranslation } from "react-i18next";
import { AdminCareerTable } from "../components/admin-career-table";

export function AdminCareerPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {t("career.title")}
        </h1>
        <AdminCareerTable />
      </div>
    </div>
  );
}
