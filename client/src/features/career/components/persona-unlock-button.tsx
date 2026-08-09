import { useTranslation } from "react-i18next";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnlockedPersonas } from "../hooks/use-unlocked-personas";
import { useUnlockPersona } from "../hooks/use-unlock-persona";

interface PersonaUnlockButtonProps {
  personaId: string;
  personaName: string;
}

// Chỉ nên render khi stage đã PASSED — BE tự kiểm tra lại điều kiện (đã
// PASSED ít nhất 1 stage dùng đúng persona này), nút này chỉ là lối vào UI.
export function PersonaUnlockButton({
  personaId,
  personaName,
}: PersonaUnlockButtonProps) {
  const { t } = useTranslation("career");
  const { data: unlocked, isLoading } = useUnlockedPersonas();
  const unlockPersona = useUnlockPersona();

  if (isLoading) return null;

  const isUnlocked = unlocked?.some((u) => u.personaId === personaId) ?? false;

  if (isUnlocked) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-500">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("personaUnlock.unlocked", { name: personaName })}
      </p>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => unlockPersona.mutate(personaId)}
      disabled={unlockPersona.isPending}
    >
      <Lock className="mr-1.5 h-3.5 w-3.5" />
      {t("personaUnlock.unlock", { name: personaName })}
    </Button>
  );
}
