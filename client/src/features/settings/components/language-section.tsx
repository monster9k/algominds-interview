import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsControlRow } from "./settings-control-row";
import { LanguageSelect } from "./language-select";

export function LanguageSection() {
  const { t } = useTranslation("settings");

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">
        {t("language.title")}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {t("language.description")}
      </p>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <SettingsControlRow icon={Languages} label={t("language.selectLabel")}>
          <LanguageSelect />
        </SettingsControlRow>
      </div>
    </section>
  );
}
