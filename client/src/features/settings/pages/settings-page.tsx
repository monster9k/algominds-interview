import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SettingsSidebar } from "../components/settings-sidebar";
import { GeneralSection } from "../components/general-section";
import { AppearanceSection } from "../components/appearance-section";
import { LanguageSection } from "../components/language-section";
import { SocialAccountsSection } from "../components/social-accounts-section";
import { PasswordSection } from "../components/password-section";
import { DangerZoneSection } from "../components/danger-zone-section";

// Map lỗi từ auth.controller.ts#googleAuthRedirect() (flow link Google) —
// xem account-linking roadmap P1.
const LINK_ERROR_KEY: Record<string, string> = {
  invalid_ticket: "social.linkErrorInvalidTicket",
  google_already_linked: "social.linkErrorAlreadyLinked",
  google_email_mismatch: "social.linkErrorEmailMismatch",
};

export function SettingsPage() {
  const { t } = useTranslation("settings");
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const linked = searchParams.get("linked");
    const error = searchParams.get("error");
    if (!linked && !error) return;

    if (linked === "google") {
      toast.success(t("social.linkedSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    } else if (error) {
      toast.error(t(LINK_ERROR_KEY[error] ?? "social.linkErrorGeneric"));
    }

    // Dọn query param khỏi URL để refresh trang không hiện lại toast.
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex gap-8">
      <SettingsSidebar />

      <div className="flex-1 max-w-2xl">
        <GeneralSection />
        <AppearanceSection />
        <LanguageSection />
        <SocialAccountsSection />
        <PasswordSection />
        <DangerZoneSection />
      </div>
    </div>
  );
}
