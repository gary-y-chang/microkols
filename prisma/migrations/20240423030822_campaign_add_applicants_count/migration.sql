/*
  Warnings:

  - You are about to drop the column `img_high` on the `Platform_Post` table. All the data in the column will be lost.
  - You are about to drop the column `img_low` on the `Platform_Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "applicants" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Platform_Post" DROP COLUMN "img_high",
DROP COLUMN "img_low",
ADD COLUMN     "img" VARCHAR(256);
