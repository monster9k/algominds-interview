import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminAuditLogTable } from "../components/admin-audit-log-table";
import { AdminPagination } from "../components/admin-pagination";
import { useAdminAuditLog } from "../hooks/use-admin-audit-log";

const PAGE_SIZE = 20;

export function AdminAuditLogPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminAuditLog({
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {t("auditLog.title")}
        </h1>

        <AdminAuditLogTable
          entries={data?.data}
          isLoading={isLoading}
          isError={isError}
        />

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
