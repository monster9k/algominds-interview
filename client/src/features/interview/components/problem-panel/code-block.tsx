/**
 * Code Block Component
 * Displays submitted code with language badge
 */

import { FileCode2 } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const displayLanguage = language === "cpp" ? "C++" : language || "Unknown";

  return (
    <div className="border-t border-zinc-800/50 pt-6">
      <div className="flex items-center gap-2 text-zinc-300 font-bold mb-3">
        <FileCode2 className="h-4 w-4" /> Code
        <span className="text-[10px] font-medium bg-zinc-800 px-1.5 py-0.5 rounded ml-1 uppercase text-zinc-400">
          {displayLanguage}
        </span>
      </div>
      <pre className="bg-zinc-900/70 border border-zinc-800/50 p-4 rounded-xl overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed shadow-inner">
        <code>{code}</code>
      </pre>
    </div>
  );
}
