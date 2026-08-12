import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../components/admin-sidebar";
import { AdminHeader } from "../components/admin-header";

export function AdminLayout() {
  return (
    <div className="h-screen overflow-hidden bg-background flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
