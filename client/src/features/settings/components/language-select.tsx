import { Languages, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useLanguageStore, type Language } from "@/stores/use-language-store";

const languageOptions: Language[] = ["en", "vi", "ja"];

export function LanguageSelect() {
  const { t } = useTranslation("settings");
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted/30">
        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
        {t(`language.${language}`)}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) => setLanguage(value as Language)}
        >
          {languageOptions.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {t(`language.${option}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
