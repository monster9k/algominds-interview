import { SettingsSidebar } from "../components/settings-sidebar";
import { GeneralSection } from "../components/general-section";
import { SocialAccountsSection } from "../components/social-accounts-section";
import { DangerZoneSection } from "../components/danger-zone-section";

export function SettingsPage() {
  return (
    <div className="flex gap-8">
      <SettingsSidebar />

      <div className="flex-1 max-w-2xl">
        <GeneralSection />
        <SocialAccountsSection />
        <DangerZoneSection />
      </div>
    </div>
  );
}
