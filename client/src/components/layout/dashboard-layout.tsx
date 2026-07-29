import { Outlet } from "react-router-dom";
import { usePanelRef } from "react-resizable-panels";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

export function DashboardLayout() {
  const sidebarPanelRef = usePanelRef();

  const toggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <DashboardHeader />

      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1"
        defaultLayout={{ sidebar: 18, content: 82 }}
      >
        {/* LEFT SIDEBAR (desktop only, resizable/collapsible) */}
        <ResizablePanel
          id="sidebar"
          panelRef={sidebarPanelRef}
          defaultSize="18%"
          minSize="10%"
          maxSize="30%"
          collapsible
          collapsedSize={0}
          className="hidden lg:block"
        >
          <DashboardSidebar />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="hidden lg:flex"
          onDoubleClick={toggleSidebar}
        />

        {/* MAIN CONTENT AREA */}
        <ResizablePanel id="content" defaultSize="82%" minSize="40%">
          <div className="h-full overflow-y-auto p-6 md:p-8">
            <Outlet />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
