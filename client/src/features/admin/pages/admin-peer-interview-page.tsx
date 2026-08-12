import { useTranslation } from "react-i18next";
import { AdminPeerInterviewTable } from "../components/admin-peer-interview-table";

export function AdminPeerInterviewPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("peerInterview.title")}</h1>
      <AdminPeerInterviewTable />
    </div>
  );
}
