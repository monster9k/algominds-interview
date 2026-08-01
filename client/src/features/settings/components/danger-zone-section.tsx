import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsRow } from "./settings-row";

export function DangerZoneSection() {
  const { t } = useTranslation("settings");

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {t("danger.title")}
      </h2>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <SettingsRow icon={Trash2} label={t("danger.deleteAccount")} danger />
      </div>
    </section>
  );
}
