import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { AdminUsersTable } from "../components/admin-users-table";
import { AdminPagination } from "../components/admin-pagination";
import { useAdminUsers } from "../hooks/use-admin-users";

const PAGE_SIZE = 20;

export function AdminUsersPage() {
  const { t } = useTranslation("admin");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminUsers({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("users.title")}</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="rounded-full pl-9"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <AdminUsersTable users={data?.data} isLoading={isLoading} isError={isError} />

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
