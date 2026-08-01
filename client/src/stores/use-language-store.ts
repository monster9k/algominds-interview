/**
 * Kho lưu trữ preference ngôn ngữ (Zustand)
 * Đồng bộ với i18next — đổi ngôn ngữ UI ngay khi setLanguage được gọi
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "@/lib/i18n";

export type Language = "en" | "vi" | "ja";

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: "language-storage",
    },
  ),
);
