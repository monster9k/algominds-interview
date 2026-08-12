import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ page, totalPages, onPageChange }: AdminPaginationProps) {
  const { t } = useTranslation("admin");

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        {t("common.pageOf", { page, totalPages })}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          {t("common.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("common.next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
