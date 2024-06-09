/*
  Warnings:

  - You are about to drop the column `approved` on the `Campaign_Apply` table. All the data in the column will be lost.
  - You are about to drop the column `done` on the `Campaign_Apply` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Campaign_Apply" DROP COLUMN "approved",
DROP COLUMN "done",
ADD COLUMN     "status" INTEGER[];
