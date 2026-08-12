import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminProblemsTable } from "../components/admin-problems-table";

export function AdminProblemsPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{t("problems.title")}</h1>
        {/* Form tạo bài tập thật để phase sau — round này chỉ layout + list */}
        <Button onClick={() => console.log("TODO: open create-problem modal")}>
          <Plus className="h-4 w-4" />
          {t("problems.createNew")}
        </Button>
      </div>

      <AdminProblemsTable />
    </div>
  );
}
