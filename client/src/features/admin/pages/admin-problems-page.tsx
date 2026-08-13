import { useEffect, useState } from "react";
import { Plus, Search, Filter, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdminProblemsTable, ProblemSortBy } from "../components/admin-problems-table";
import { AdminTableFooter } from "../components/admin-table-footer";
import { ProblemFormDialog } from "../components/problem-form-dialog";
import { ConfirmDialog } from "../components/confirm-dialog";
import { useAdminProblems } from "../hooks/use-admin-problems";
import { useDeleteProblem } from "../hooks/use-delete-problem";
import { ProblemDifficulty } from "../types";

const DIFFICULTY_OPTIONS: ProblemDifficulty[] = ["EASY", "MEDIUM", "HARD"];

export function AdminProblemsPage() {
  const { t } = useTranslation("admin");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("displayId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [difficultyFilter, setDifficultyFilter] = useState<ProblemDifficulty[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useAdminProblems({
    page,
    limit,
    search: search.trim() || undefined,
    sortBy,
    sortDirection,
    difficulty: difficultyFilter.length > 0 ? difficultyFilter.join(",") : undefined,
  });

  // Đổi trang/search/sort/filter → bỏ chọn hết, tránh giữ selection "vô hình"
  // trỏ tới row không còn hiển thị.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, search, sortBy, sortDirection, difficultyFilter]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const deleteProblem = useDeleteProblem();

  const openCreate = () => {
    setEditingId(undefined);
    setFormOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectable = (data?.data ?? []).filter((p) => !p.deletedAt);
    const allSelected = selectable.length > 0 && selectable.every((p) => selectedIds.has(p.id));
    setSelectedIds(allSelected ? new Set() : new Set(selectable.map((p) => p.id)));
  };

  const toggleDifficulty = (difficulty: ProblemDifficulty) => {
    setDifficultyFilter((prev) =>
      prev.includes(difficulty) ? prev.filter((d) => d !== difficulty) : [...prev, difficulty],
    );
  };

  const handleSort = (column: ProblemSortBy) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteProblem.mutateAsync(id)));
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t("problems.title")}</h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {t("problems.subtitle", { count: data.total })}
            </p>
          )}
        </div>
        <Button className="h-9 rounded-full" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("problems.createNew")}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-9 w-9 shrink-0 rounded-full">
              <Filter className="h-4 w-4" />
              {difficultyFilter.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t("problems.filterDifficulty")}</span>
                {difficultyFilter.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    onClick={() => setDifficultyFilter([])}
                  >
                    <X className="h-3 w-3" />
                    {t("problems.filterClear")}
                  </button>
                )}
              </div>
              {DIFFICULTY_OPTIONS.map((difficulty) => (
                <label key={difficulty} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <Checkbox
                    checked={difficultyFilter.includes(difficulty)}
                    onCheckedChange={() => toggleDifficulty(difficulty)}
                  />
                  {t(`difficulty.${difficulty.toLowerCase()}`)}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 rounded-full pl-9"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-sm text-foreground">
            {t("problems.selectedCount", { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              {t("common.delete")} ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      <AdminProblemsTable
        problems={data?.data}
        isLoading={isLoading}
        isError={isError}
        onEdit={openEdit}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {data && (
        <AdminTableFooter
          page={page}
          limit={limit}
          total={data.total}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      <ProblemFormDialog open={formOpen} onOpenChange={setFormOpen} problemId={editingId} />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("problems.bulkDeleteConfirmTitle", { count: selectedIds.size })}
        description={t("problems.deleteConfirmDescription")}
        isLoading={isBulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
