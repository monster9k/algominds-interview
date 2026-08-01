/**
 * Code Block Component
 * Displays submitted code with language badge
 */

import { FileCode2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const { t } = useTranslation("interview");
  const displayLanguage =
    language === "cpp" ? "C++" : language || t("common.unknownLanguage");

  return (
    <div className="border-t border-border/50 pt-6">
      <div className="flex items-center gap-2 text-foreground font-bold mb-3">
        <FileCode2 className="h-4 w-4" /> {t("submissionDetail.code")}
        <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded ml-1 uppercase text-muted-foreground">
          {displayLanguage}
        </span>
      </div>
      <pre className="bg-card/70 border border-border/50 p-4 rounded-xl overflow-x-auto text-xs text-foreground font-mono leading-relaxed shadow-inner">
        <code>{code}</code>
      </pre>
    </div>
  );
}
