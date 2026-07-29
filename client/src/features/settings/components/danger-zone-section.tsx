import { Trash2 } from "lucide-react";
import { SettingsRow } from "./settings-row";

export function DangerZoneSection() {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Danger Zone
      </h2>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <SettingsRow icon={Trash2} label="Delete Account" danger />
      </div>
    </section>
  );
}
