import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminContestsTable } from "../components/admin-contests-table";
import { AdminPagination } from "../components/admin-pagination";
import { ContestFormDialog } from "../components/contest-form-dialog";
import { useAdminContests } from "../hooks/use-admin-contests";
import { AdminContestListItem } from "../types";

const PAGE_SIZE = 20;

export function AdminContestsPage() {
  const { t } = useTranslation("admin");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminContests({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<AdminContestListItem | undefined>(undefined);

  const openCreate = () => {
    setEditingContest(undefined);
    setFormOpen(true);
  };
  const openEdit = (contest: AdminContestListItem) => {
    setEditingContest(contest);
    setFormOpen(true);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{t("contests.title")}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("contests.createNew")}
        </Button>
      </div>

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

      <AdminContestsTable
        contests={data?.data}
        isLoading={isLoading}
        isError={isError}
        onEdit={openEdit}
      />

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ContestFormDialog open={formOpen} onOpenChange={setFormOpen} contest={editingContest} />
    </div>
  );
}
