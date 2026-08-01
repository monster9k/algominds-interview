import { SunMoon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsControlRow } from "./settings-control-row";
import { ThemeToggleGroup } from "./theme-toggle-group";

export function AppearanceSection() {
  const { t } = useTranslation("settings");

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">
        {t("appearance.title")}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {t("appearance.description")}
      </p>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <SettingsControlRow icon={SunMoon} label={t("appearance.themeLabel")}>
          <ThemeToggleGroup />
        </SettingsControlRow>
      </div>
    </section>
  );
}
