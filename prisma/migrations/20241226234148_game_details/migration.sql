-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('Asc', 'Desc');

-- CreateEnum
CREATE TYPE "ScoreFormat" AS ENUM ('Time');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "formatScore" "ScoreFormat",
ADD COLUMN     "sortDirection" "Direction" NOT NULL DEFAULT 'Desc';
