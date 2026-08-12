import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminContestsTable } from "../components/admin-contests-table";

export function AdminContestsPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{t("contests.title")}</h1>
        <Button onClick={() => console.log("TODO: open create-contest modal")}>
          <Plus className="h-4 w-4" />
          {t("contests.createNew")}
        </Button>
      </div>

      <AdminContestsTable />
    </div>
  );
}
