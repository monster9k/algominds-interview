import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// Import các components con đã tách
import { InterviewHeader } from "../components/interview-header";
import { ProblemPanel } from "../components/problem-panel";
import { CodeEditorPanel } from "../components/code-editor-panel";
import { ConsolePanel } from "../components/console-panel";

export function InterviewRoom() {
  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden text-sm">
      {/* 1. HEADER */}
      <InterviewHeader />

      {/* 2. WORKSPACE */}
      <div className="flex-1 overflow-hidden p-2">
        <ResizablePanelGroup
          orientation="horizontal"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50"
        >
          {/* TRÁI: PROBLEM PANEL */}
          <ResizablePanel
            defaultSize={40}
            minSize={25}
            className="bg-zinc-950 rounded-l-lg mr-1.5"
          >
            <ProblemPanel />
          </ResizablePanel>

          <ResizableHandle className="bg-zinc-900 w-1.5 border-l border-r border-zinc-800 hover:bg-rose-500/50 transition-colors" />

          {/* PHẢI: EDITOR & CONSOLE */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup orientation="vertical">
              {/* EDITOR PANEL */}
              <ResizablePanel
                defaultSize={60}
                minSize={20}
                className="bg-zinc-950 rounded-tr-lg mb-1.5"
              >
                <CodeEditorPanel />
              </ResizablePanel>

              <ResizableHandle className="bg-zinc-900 h-1.5 border-t border-b border-zinc-800 hover:bg-rose-500/50 transition-colors" />

              {/* CONSOLE PANEL */}
              <ResizablePanel
                defaultSize={40}
                minSize={10}
                className="bg-zinc-950 rounded-br-lg"
              >
                <ConsolePanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 3. FOOTER (STATUS BAR) */}
      <footer className="h-7 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 justify-between text-[11px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 hover:text-zinc-300 cursor-pointer transition-colors">
            <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
            <span>Ready</span>
          </div>
          <span>Console</span>
        </div>
      </footer>
    </div>
  );
}
