-- Compact the "problems"."displayId" sequence back to gap-free values.
--
-- Repeated re-runs of sync-problems.ts (each processing all problem folders)
-- used prisma.problem.upsert(), which on Postgres compiles to a single
-- `INSERT ... ON CONFLICT DO UPDATE`. Building the candidate insert row
-- evaluates the displayId column's `DEFAULT nextval(...)` even when the
-- conflict/update branch is taken, so every re-sync of an already-existing
-- problem silently burned one sequence value. Over many dev iterations this
-- fragmented displayId into large, meaningless gaps (e.g. 32 -> 95 -> 97 ->
-- 103) while the underlying sequence ran far ahead of the actual row count.
--
-- This migration renumbers displayId densely (1..N), preserving the existing
-- relative order, and resets the sequence to match. sync-problems.ts has
-- separately been fixed to use explicit findUnique + update/create instead of
-- upsert, so this gap won't reappear on future re-syncs.
BEGIN;

ALTER TABLE "problems" DISABLE TRIGGER "problems_display_id_immutable";

WITH ordered_problems AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "displayId" ASC) AS rn
  FROM "problems"
)
UPDATE "problems" p
SET "displayId" = op.rn
FROM ordered_problems op
WHERE p."id" = op."id";

ALTER TABLE "problems" ENABLE TRIGGER "problems_display_id_immutable";

SELECT setval(
  '"problems_displayId_seq"',
  (SELECT MAX("displayId") FROM "problems"),
  true
);

COMMIT;
