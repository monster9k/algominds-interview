import { Outlet } from "react-router-dom";
import { IconSidebar, type SidebarNavItem } from "./icon-sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  items: SidebarNavItem[];
  /** i18n namespace dùng cho labelKey của `items` (khác nhau giữa admin/user) */
  namespace: string;
  /** Chuông thông báo + coin-balance pill ở TopBar — chỉ bật ở biến thể user */
  showUserActions?: boolean;
}

// Shell dùng chung cho cả admin và user — chỉ khác `items`/`namespace` truyền
// vào, đúng yêu cầu "giữ nguyên UI, chỉ thay bằng các tab của trang admin".
export function AppShell({ items, namespace, showUserActions }: AppShellProps) {
  return (
    <div className="h-screen overflow-hidden bg-background flex">
      <div className="hidden lg:flex">
        <IconSidebar items={items} namespace={namespace} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar items={items} namespace={namespace} showUserActions={showUserActions} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
