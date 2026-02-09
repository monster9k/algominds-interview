import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 z-50">
        <DashboardSidebar />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <DashboardHeader />
        <div className="flex-1 p-6 md:p-8 pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
