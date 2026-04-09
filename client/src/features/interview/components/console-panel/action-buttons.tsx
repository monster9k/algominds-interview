import { Button } from "@/components/ui/button";
import { ActionButtonsProps } from "./types";
import { STYLES } from "./constants";

/**
 * ActionButtons - Displays Analysis and Solution buttons
 * Used in result views for quick access to analysis and solutions
 */
export function ActionButtons({ onAnalysis, onSolution }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Button
        variant="outline"
        className={`${STYLES.ACTION_BUTTON_ANALYSIS}`}
        onClick={onAnalysis}
      >
        Analysis
      </Button>
      <Button
        variant="outline"
        className={`${STYLES.ACTION_BUTTON_SOLUTION}`}
        onClick={onSolution}
      >
        Solution
      </Button>
    </div>
  );
}
