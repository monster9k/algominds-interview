import { useTranslation } from "react-i18next";
import { AdminDiscussTable } from "../components/admin-discuss-table";

export function AdminDiscussPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {t("discuss.title")}
        </h1>
        <AdminDiscussTable />
      </div>
    </div>
  );
}
