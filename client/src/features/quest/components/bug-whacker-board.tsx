import { FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubmitAnswerResult } from "../types";

interface BugWhackerBoardProps {
  code: string;
  language: string;
  selectedLine: number | null;
  disabled?: boolean;
  result?: SubmitAnswerResult | null;
  onSelectLine: (lineIndex: number) => void;
}

// "Line Sweeper" — hiển thị đoạn code theo dòng, click 1 dòng = chọn dòng đó
// chứa bug. Không dùng lib syntax-highlight mới (repo chưa có shiki/prism),
// giữ tối giản theo <pre><code> + font-mono như code-block.tsx.
export function BugWhackerBoard({
  code,
  language,
  selectedLine,
  disabled,
  result,
  onSelectLine,
}: BugWhackerBoardProps) {
  const lines = code.split("\n");
  const displayLanguage = language === "cpp" ? "C++" : language;

  return (
    <div className="bg-card/70 border border-border/50 rounded-xl shadow-inner overflow-hidden">
      <div className="flex items-center gap-2 text-foreground font-bold px-4 pt-4 pb-2">
        <FileCode2 className="h-4 w-4" />
        <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded uppercase text-muted-foreground">
          {displayLanguage}
        </span>
      </div>
      <pre className="sm:overflow-x-auto text-xs font-mono leading-relaxed pb-2">
        <code>
          {lines.map((line, index) => {
            const isBuggyLine = result?.buggyLine === index;
            const isWrongSelection =
              !!result && !result.correct && selectedLine === index;

            return (
              <button
                key={index}
                type="button"
                disabled={disabled}
                onClick={() => onSelectLine(index)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-1 text-left transition-colors",
                  "hover:bg-muted/50 disabled:cursor-not-allowed",
                  !result &&
                    selectedLine === index &&
                    "bg-primary/10 border-l-2 border-primary",
                  isBuggyLine &&
                    "bg-emerald-500/20 border-l-2 border-emerald-500",
                  isWrongSelection &&
                    "bg-destructive/20 border-l-2 border-destructive",
                )}
              >
                <span className="select-none text-muted-foreground w-6 shrink-0 text-right">
                  {index + 1}
                </span>
                {/* Mobile: bọc dòng dài để đọc/click trọn 1 dòng không cần cuộn
                    ngang. Từ sm trở lên giữ 1 dòng + cuộn ngang như code-block.tsx. */}
                <span className="whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal text-foreground">
                  {line}
                </span>
              </button>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
