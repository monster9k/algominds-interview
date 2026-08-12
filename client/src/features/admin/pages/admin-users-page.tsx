import { useTranslation } from "react-i18next";
import { AdminUsersTable } from "../components/admin-users-table";

export function AdminUsersPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("users.title")}</h1>
      <AdminUsersTable />
    </div>
  );
}
