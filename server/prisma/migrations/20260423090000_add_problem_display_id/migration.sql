BEGIN;

-- 1) Add displayId as nullable first for safe rollout on existing rows.
ALTER TABLE "problems" ADD COLUMN "displayId" INTEGER;

-- 2) Create explicit sequence for displayId.
CREATE SEQUENCE "problems_displayId_seq";

-- 3) Backfill existing rows in stable order: createdAt ASC, id ASC.
WITH ordered_problems AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "problems"
)
UPDATE "problems" p
SET "displayId" = op.rn
FROM ordered_problems op
WHERE p."id" = op."id";

-- 4) Ensure next inserts continue from max(displayId).
WITH max_display_id AS (
  SELECT MAX("displayId") AS value FROM "problems"
)
SELECT setval(
  '"problems_displayId_seq"',
  COALESCE((SELECT value FROM max_display_id), 1),
  (SELECT value IS NOT NULL FROM max_display_id)
);

-- 5) Set default + constraints.
ALTER TABLE "problems"
  ALTER COLUMN "displayId" SET DEFAULT nextval('"problems_displayId_seq"'),
  ALTER COLUMN "displayId" SET NOT NULL;

ALTER SEQUENCE "problems_displayId_seq" OWNED BY "problems"."displayId";

CREATE UNIQUE INDEX "problems_displayId_key" ON "problems"("displayId");

-- 6) Protect immutability at DB level.
CREATE OR REPLACE FUNCTION "prevent_problem_display_id_update"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."displayId" <> OLD."displayId" THEN
    RAISE EXCEPTION 'displayId is immutable and cannot be updated';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "problems_display_id_immutable"
BEFORE UPDATE ON "problems"
FOR EACH ROW
EXECUTE FUNCTION "prevent_problem_display_id_update"();

COMMIT;
