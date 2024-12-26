-- CreateEnum
CREATE TYPE "ModeratorRole" AS ENUM ('Moderator', 'Admin');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "formatters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moderator" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ModeratorRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Score" (
    "gameId" TEXT NOT NULL,
    "moderatorName" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_key_key" ON "Moderator"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_name_key" ON "Moderator"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Score_gameId_playerName_key" ON "Score"("gameId", "playerName");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_moderatorName_fkey" FOREIGN KEY ("moderatorName") REFERENCES "Moderator"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
