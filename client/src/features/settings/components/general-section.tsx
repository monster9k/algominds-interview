import { UserRound, Mail, Phone, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { SettingsRow } from "./settings-row";

const generalRows = [
  { icon: UserRound, labelKey: "general.leetcodeId", value: "dokhoaminh" },
  { icon: Mail, labelKey: "general.email", value: "monster72***@gmail.com" },
  { icon: Phone, labelKey: "general.phoneNumber", value: undefined },
  { icon: KeyRound, labelKey: "general.password", value: "********" },
] as const;

export function GeneralSection() {
  const { t } = useTranslation("settings");

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">
        {t("general.title")}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {t("general.description")}
      </p>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {generalRows.map((row, index) => (
          <SettingsRow
            key={row.labelKey}
            icon={row.icon}
            label={t(row.labelKey)}
            value={row.value}
            className={cn(
              index < generalRows.length - 1 && "border-b border-border",
            )}
          />
        ))}
      </div>
    </section>
  );
}
