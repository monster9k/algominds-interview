import { useTranslation } from "react-i18next";
import { AdminStoreTable } from "../components/admin-store-table";

export function AdminStorePage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("store.title")}</h1>
      <AdminStoreTable />
    </div>
  );
}
