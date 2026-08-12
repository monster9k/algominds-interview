import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/use-auth-store";
import { AdminUser } from "../types";
import { ConfirmDialog } from "./confirm-dialog";
import { useUpdateUserRole } from "../hooks/use-update-user-role";
import { useDeleteUser } from "../hooks/use-delete-user";

interface AdminUsersTableProps {
  users?: AdminUser[];
  isLoading: boolean;
  isError: boolean;
}

export function AdminUsersTable({ users, isLoading, isError }: AdminUsersTableProps) {
  const { t } = useTranslation("admin");
  const currentUserId = useAuthStore((state) => state.user?.userId);
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("users.columnId")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("users.columnName")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("users.columnEmail")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("users.columnRole")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("users.columnCreatedAt")}</TableHead>
            <TableHead className="h-11 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("problems.columnActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell colSpan={6} className="h-32 text-center text-destructive">
                {t("users.loadError")}
              </TableCell>
            </TableRow>
          ) : users?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                {t("users.empty")}
              </TableCell>
            </TableRow>
          ) : (
            users?.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <TableRow key={user.id} className="border-0 hover:bg-muted/50 transition-colors">
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {user.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{user.email}</TableCell>
                  <TableCell>
                    {user.deletedAt ? (
                      <Badge variant="destructive">{t("problems.statusDeleted")}</Badge>
                    ) : (
                      <Select
                        value={user.role}
                        disabled={isSelf}
                        onValueChange={(role) => updateRole.mutate({ id: user.id, role })}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingId(user.id)}
                      disabled={isSelf || !!user.deletedAt}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t("users.deleteConfirmTitle")}
        description={t("users.deleteConfirmDescription")}
        isLoading={deleteUser.isPending}
        onConfirm={() => {
          if (!deletingId) return;
          deleteUser.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
        }}
      />
    </div>
  );
}
