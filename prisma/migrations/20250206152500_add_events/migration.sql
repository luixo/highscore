-- AlterTable (add column without NOT NULL constraint first)
ALTER TABLE "Game" ADD COLUMN "eventId" TEXT;
ALTER TABLE "Moderator" ADD COLUMN "eventId" TEXT;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Event" ("id", "title") VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'unknown');

-- Assign the default eventId to existing rows
UPDATE "Game" SET "eventId" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE "eventId" IS NULL;
UPDATE "Moderator" SET "eventId" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE "eventId" IS NULL;

-- AlterTable (now enforce NOT NULL constraint)
ALTER TABLE "Game" ALTER COLUMN "eventId" SET NOT NULL;
ALTER TABLE "Moderator" ALTER COLUMN "eventId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Moderator" ADD CONSTRAINT "Moderator_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
