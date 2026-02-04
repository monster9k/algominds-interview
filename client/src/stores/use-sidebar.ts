/**
 * Global UI State Store (Zustand)
 * Manages global UI state like sidebar visibility, modals, etc.
 * Only store truly global state here - prefer local state when possible
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
      name: "sidebar-storage", // localStorage key
      partialize: (state) => ({ isOpen: state.isOpen }), // Only persist isOpen
    },
  ),
);

/**
 * Usage example:
 * const { isOpen, toggle } = useSidebar();
 * <button onClick={toggle}>Toggle Sidebar</button>
 */
