import { UserRound, Mail, Phone, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsRow } from "./settings-row";

const generalRows = [
  { icon: UserRound, label: "LeetCode ID", value: "dokhoaminh" },
  { icon: Mail, label: "Email", value: "monster72***@gmail.com" },
  { icon: Phone, label: "Phone Number", value: undefined },
  { icon: KeyRound, label: "Password", value: "********" },
];

export function GeneralSection() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">General</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        You can log in using your email, phone number, or LeetCode ID.
      </p>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {generalRows.map((row, index) => (
          <SettingsRow
            key={row.label}
            icon={row.icon}
            label={row.label}
            value={row.value}
            className={cn(
              index < generalRows.length - 1 && "border-b border-border",
            )}
          />
        ))}
      </div>
    </section>
  );
}
