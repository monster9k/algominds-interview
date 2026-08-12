import { useTranslation } from "react-i18next";

const faqKeys = [
  "thinkFirst",
  "credits",
  "quest",
  "contests",
  "peerInterview",
] as const;

export function HelpCenterPage() {
  const { t } = useTranslation("settings");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">
        {t("helpCenter.title")}
      </h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        {t("helpCenter.description")}
      </p>

      <section className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
        {faqKeys.map((key) => (
          <div key={key} className="px-4 py-4">
            <h3 className="text-sm font-medium text-foreground">
              {t(`helpCenter.faq.${key}.question`)}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t(`helpCenter.faq.${key}.answer`)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
