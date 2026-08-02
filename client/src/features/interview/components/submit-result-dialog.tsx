import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { SubmissionResponse } from "../types";
import { ResultAccepted } from "./console-panel/result-accepted";
import { ResultFailed } from "./console-panel/result-failed";

interface SubmitResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SubmissionResponse | null;
}

/**
 * Popup tổng kết sau khi bấm "Submit" — tái dùng ResultAccepted/ResultFailed
 * (vốn phục vụ tab Result của "Run") vì SubmissionResponse là superset field
 * của RunCodeResponse mà 2 component đó nhận vào.
 */
export function SubmitResultDialog({
  open,
  onOpenChange,
  result,
}: SubmitResultDialogProps) {
  const { t } = useTranslation("interview");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          {t("submissionDetail.dialogTitle")}
        </DialogTitle>
        {result &&
          (result.status === "ACCEPTED" ? (
            <>
              <ResultAccepted submissionResult={result} />
              {result.evaluationStatus === "PENDING" && (
                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                  {t("submissionDetail.evaluationPending")}
                </p>
              )}
            </>
          ) : (
            <ResultFailed submissionResult={result} />
          ))}
      </DialogContent>
    </Dialog>
  );
}
