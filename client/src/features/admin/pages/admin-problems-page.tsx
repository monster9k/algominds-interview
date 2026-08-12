import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminProblemsTable } from "../components/admin-problems-table";
import { AdminPagination } from "../components/admin-pagination";
import { ProblemFormDialog } from "../components/problem-form-dialog";
import { useAdminProblems } from "../hooks/use-admin-problems";

const PAGE_SIZE = 20;

export function AdminProblemsPage() {
  const { t } = useTranslation("admin");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminProblems({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const openCreate = () => {
    setEditingId(undefined);
    setFormOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t("problems.title")}</h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {t("problems.subtitle", { count: data.total })}
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("problems.createNew")}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <AdminProblemsTable
        problems={data?.data}
        isLoading={isLoading}
        isError={isError}
        onEdit={openEdit}
      />

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ProblemFormDialog open={formOpen} onOpenChange={setFormOpen} problemId={editingId} />
    </div>
  );
}
