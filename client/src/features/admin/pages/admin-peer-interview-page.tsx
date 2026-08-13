import { useTranslation } from "react-i18next";
import { AdminPeerInterviewTable } from "../components/admin-peer-interview-table";

export function AdminPeerInterviewPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {t("peerInterview.title")}
        </h1>
        <AdminPeerInterviewTable />
      </div>
    </div>
  );
}
