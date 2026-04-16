/**
 * Submissions Tab Container
 * Manages state for submissions list vs detail view
 * Conditionally renders SubmissionsList or SubmissionDetail
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import { SubmissionResponse } from "../../types";
import { SubmissionsList } from "../submissions-list";
import { SubmissionDetail } from "../submission-detail";

interface SubmissionsTabProps {
  submissions: SubmissionResponse[];
  selectedSubmission: SubmissionResponse | null;
  onSelectSubmission: (submission: SubmissionResponse) => void;
  onClearSelection: () => void;
}

export function SubmissionsTab({
  submissions,
  selectedSubmission,
  onSelectSubmission,
  onClearSelection,
}: SubmissionsTabProps) {
  return (
    <TabsContent value="submissions" className="mt-0 p-0">
      <ScrollArea className="h-full">
        {!selectedSubmission ? (
          /* View 1: Submissions List */
          <SubmissionsList
            submissions={submissions}
            onSelectSubmission={onSelectSubmission}
          />
        ) : (
          /* View 2: Submission Detail */
          <SubmissionDetail
            submission={selectedSubmission}
            onBack={onClearSelection}
          />
        )}
      </ScrollArea>
    </TabsContent>
  );
}
