import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanies } from "../hooks/use-companies";

export function TrendingCompaniesWidget() {
  const [search, setSearch] = useState("");
  const { t } = useTranslation("problems");
  const { data: companies, isPending, isError } = useCompanies();

  const filtered = (companies ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <Card className="bg-card border-border p-4">
      <h3 className="font-semibold text-foreground mb-3 text-sm">
        {t("companies.title")}
      </h3>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={t("companies.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs bg-background/50 border-border focus:border-ring text-foreground rounded-md"
        />
      </div>

      {isPending && (
        <div className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-7 rounded-md" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-xs text-destructive">{t("companies.errorLoading")}</p>
      )}

      {!isPending && !isError && (
        <div className="grid grid-cols-2 gap-1.5">
          {filtered.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-md bg-muted/60 border border-border hover:bg-muted cursor-pointer transition-colors"
            >
              <span className="text-[11px] text-foreground truncate">
                {company.name}
              </span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-background/60 text-muted-foreground shrink-0">
                {company.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
