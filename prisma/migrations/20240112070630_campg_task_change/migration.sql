/*
  Warnings:

  - You are about to drop the column `created_at` on the `Campaign_KOL_Type` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Campaign_KOL_Type` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Campaign_Task` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Campaign_Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Campaign_KOL_Type" DROP COLUMN "created_at",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "Campaign_Task" DROP COLUMN "created_at",
DROP COLUMN "updated_at";
