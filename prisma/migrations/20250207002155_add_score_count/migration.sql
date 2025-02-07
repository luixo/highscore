-- AlterTable
ALTER TABLE "Score"
ADD COLUMN "scoreCount" INTEGER;

UPDATE "Score"
SET "scoreCount" = 1;

ALTER TABLE "Score"
ALTER COLUMN "scoreCount" SET NOT NULL;
