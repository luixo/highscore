-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_moderatorName_fkey";

-- DropIndex
DROP INDEX "Moderator_name_key";

-- AlterTable
ALTER TABLE "Score"
ADD COLUMN "moderatorKey" TEXT;

UPDATE "Score"
SET "moderatorKey" = "Moderator"."key"
FROM "Moderator"
WHERE "Score"."moderatorName" = "Moderator"."name";

-- AlterTable
ALTER TABLE "Score"
ALTER COLUMN "moderatorKey" SET NOT NULL;

-- AlterTable
ALTER TABLE "Score"
DROP COLUMN "moderatorName";

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_name_eventId_key" ON "Moderator"("name", "eventId");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_moderatorKey_fkey" FOREIGN KEY ("moderatorKey") REFERENCES "Moderator"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
