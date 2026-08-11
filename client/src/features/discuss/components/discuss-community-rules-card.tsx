import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DiscussCommunityRulesCard() {
  const { t } = useTranslation("discuss");
  const rules = t("sidebar.rules.items", { returnObjects: true }) as string[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm tracking-wide text-muted-foreground">
          {t("sidebar.rules.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rules.map((rule) => (
          <p key={rule} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="text-muted-foreground">{rule}</span>
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
