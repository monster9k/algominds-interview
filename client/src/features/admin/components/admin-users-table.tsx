import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers } from "../hooks/use-admin-users";

export function AdminUsersTable() {
  const { t } = useTranslation("admin");
  const { data: users, isLoading, isError } = useAdminUsers();

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">{t("users.columnId")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("users.columnEmail")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("users.columnName")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("users.columnRole")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("users.columnCreatedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell colSpan={5} className="h-32 text-center text-destructive">
                {t("users.loadError")}
              </TableCell>
            </TableRow>
          ) : users?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                {t("users.empty")}
              </TableCell>
            </TableRow>
          ) : (
            users?.map((user) => (
              <TableRow key={user.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {user.id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-foreground">{user.email}</TableCell>
                <TableCell className="text-foreground">{user.name}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
