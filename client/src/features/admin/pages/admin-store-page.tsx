import { useTranslation } from "react-i18next";
import { AdminStoreTable } from "../components/admin-store-table";

export function AdminStorePage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {t("store.title")}
        </h1>
        <AdminStoreTable />
      </div>
    </div>
  );
}
