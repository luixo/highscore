/*
  Warnings:

  - Added the required column `scoreCount` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "scoreCount" INTEGER NOT NULL;
