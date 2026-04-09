/**
 * Submissions Tab Container
 * Manages state for submissions list vs detail view
 * Conditionally renders SubmissionsList or SubmissionDetail
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import { Submission, MOCK_SUBMISSIONS } from "./mockData";
import { SubmissionsList } from "../submissions-list";
import { SubmissionDetail } from "../submission-detail";

interface SubmissionsTabProps {
  selectedSubmission: Submission | null;
  onSelectSubmission: (submission: Submission) => void;
  onClearSelection: () => void;
}

export function SubmissionsTab({
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
            submissions={MOCK_SUBMISSIONS}
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
