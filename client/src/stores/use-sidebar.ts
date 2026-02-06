/**
 * Kho lưu trữ trạng thái UI toàn cục (Zustand)
 * Quản lý trạng thái UI toàn cục như hiển thị sidebar, modals, v.v.
 * Chỉ lưu trữ trạng thái thực sự toàn cục ở đây - ưu tiên trạng thái cục bộ khi có thể
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setMobile: (isMobile: boolean) => void;
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      isMobile: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setMobile: (isMobile: boolean) => set({ isMobile }),
    }),
    {
      name: "sidebar-storage", // Khóa trong localStorage
      partialize: (state) => ({ isOpen: state.isOpen }), // Chỉ lưu trữ trạng thái isOpen
    },
  ),
);

/**
 * Ví dụ sử dụng:
 * const { isOpen, toggle } = useSidebar();
 * <button onClick={toggle}>Chuyển đổi Sidebar</button>
 */
