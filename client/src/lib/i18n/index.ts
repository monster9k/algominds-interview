import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enProblems from "./locales/en/problems.json";
import enInterview from "./locales/en/interview.json";
import enUsers from "./locales/en/users.json";
import enSettings from "./locales/en/settings.json";
import enQuest from "./locales/en/quest.json";
import enContests from "./locales/en/contests.json";
import enCareer from "./locales/en/career.json";
import enPeerInterview from "./locales/en/peer-interview.json";

import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viProblems from "./locales/vi/problems.json";
import viInterview from "./locales/vi/interview.json";
import viUsers from "./locales/vi/users.json";
import viSettings from "./locales/vi/settings.json";
import viQuest from "./locales/vi/quest.json";
import viContests from "./locales/vi/contests.json";
import viCareer from "./locales/vi/career.json";
import viPeerInterview from "./locales/vi/peer-interview.json";

import jaCommon from "./locales/ja/common.json";
import jaAuth from "./locales/ja/auth.json";
import jaProblems from "./locales/ja/problems.json";
import jaInterview from "./locales/ja/interview.json";
import jaUsers from "./locales/ja/users.json";
import jaSettings from "./locales/ja/settings.json";
import jaQuest from "./locales/ja/quest.json";
import jaContests from "./locales/ja/contests.json";
import jaCareer from "./locales/ja/career.json";
import jaPeerInterview from "./locales/ja/peer-interview.json";

const STORAGE_KEY = "language-storage";

function getStoredLanguage(): "en" | "vi" | "ja" {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const language = raw ? JSON.parse(raw)?.state?.language : undefined;
    if (language === "en" || language === "vi" || language === "ja") {
      return language;
    }
  } catch {
    // localStorage không khả dụng hoặc dữ liệu hỏng — dùng mặc định
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      problems: enProblems,
      interview: enInterview,
      users: enUsers,
      settings: enSettings,
      quest: enQuest,
      contests: enContests,
      career: enCareer,
      peerInterview: enPeerInterview,
    },
    vi: {
      common: viCommon,
      auth: viAuth,
      problems: viProblems,
      interview: viInterview,
      users: viUsers,
      settings: viSettings,
      quest: viQuest,
      contests: viContests,
      career: viCareer,
      peerInterview: viPeerInterview,
    },
    ja: {
      common: jaCommon,
      auth: jaAuth,
      problems: jaProblems,
      interview: jaInterview,
      users: jaUsers,
      settings: jaSettings,
      quest: jaQuest,
      contests: jaContests,
      career: jaCareer,
      peerInterview: jaPeerInterview,
    },
  },
  lng: getStoredLanguage(),
  fallbackLng: "en",
  ns: [
    "common",
    "auth",
    "problems",
    "interview",
    "users",
    "settings",
    "quest",
    "contests",
    "career",
    "peerInterview",
  ],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
