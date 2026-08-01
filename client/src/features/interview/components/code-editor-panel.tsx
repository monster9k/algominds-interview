import Editor from "@monaco-editor/react";
import { RotateCcw, Maximize2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";

export const CodeEditorPanel = memo(function CodeEditorPanel({
  initialCode,
  isLocked,
  code,
  onCodeChange,
  language,
  onLanguageChange,
}: {
  initialCode: Record<string, string>;
  isLocked: boolean;
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
}) {
  const { t } = useTranslation("interview");
  const { resolvedTheme } = useTheme();
  const prevLanguageRef = useRef(language);

  useEffect(() => {
    const prevLanguage = prevLanguageRef.current;
    prevLanguageRef.current = language;

    if (prevLanguage === language) return;

    const newTemplate = initialCode?.[language] ?? "";
    const prevTemplate = initialCode?.[prevLanguage] ?? "";
    const isPristine = code === prevTemplate || code === "";

    if (isPristine) {
      onCodeChange(newTemplate);
      return;
    }

    const confirmed = window.confirm(
      t("editor.switchLanguageConfirm", { language }),
    );

    if (confirmed) {
      onCodeChange(newTemplate);
    } else {
      // Revert the language dropdown back
      onLanguageChange(prevLanguage);
    }
  }, [language]);

  const defaultCode = initialCode?.[language] ?? "// Write your code here";

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Editor Toolbar */}
      <div className="h-10 border-b border-border bg-card/50 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-rose-500">
            &lt;/&gt; {t("editor.title")}
          </span>
          <div className="h-3 w-px bg-border" />
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-7 w-[130px] bg-transparent border-none text-xs text-foreground focus:ring-0 px-2 hover:bg-accent transition-colors">
              <SelectValue placeholder={t("editor.languagePlaceholder")} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="java">Java</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}

      <div className="flex-1 relative min-h-0 overflow-hidden">
        {isLocked && (
          <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-muted-foreground">
            <Lock className="h-8 w-8 mb-3 text-rose-500" />
            <p className="font-semibold text-foreground">
              {t("editor.locked")}
            </p>
            <p className="text-xs mt-1">{t("editor.lockedHint")}</p>
          </div>
        )}
        <div className="absolute inset-0">
          <Editor
            height="100%"
            language={language}
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={code || defaultCode}
            onChange={(value) => onCodeChange(value || "")}
            options={{
              readOnly: isLocked,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineHeight: 24,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16 },
              tabSize: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
});
