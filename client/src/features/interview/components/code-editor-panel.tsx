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

export function CodeEditorPanel({
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
  const codeTemplate = initialCode
    ? initialCode[language]
    : "// Write your code here";
  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Editor Toolbar */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-rose-500">
            &lt;/&gt; Code
          </span>
          <div className="h-3 w-px bg-zinc-700" />
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-7 w-[130px] bg-transparent border-none text-xs text-zinc-300 focus:ring-0 px-2 hover:bg-zinc-800 transition-colors">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
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
            className="h-6 w-6 text-zinc-500 hover:text-zinc-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-200"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}

      <div className="flex-1 relative min-h-0 overflow-hidden">
        {isLocked && (
          <div className="absolute inset-0 z-20 bg-zinc-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-zinc-400">
            <Lock className="h-8 w-8 mb-3 text-rose-500" />
            <p className="font-semibold text-white">Editor is locked</p>
            <p className="text-xs mt-1">
              Discuss your strategy with AI in the console first!
            </p>
          </div>
        )}
        <div className="absolute inset-0">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code || codeTemplate}
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
}
