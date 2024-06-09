/*
  Warnings:

  - You are about to alter the column `brand_name` on the `Campaign` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `brand_logo` on the `Campaign` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.

*/
-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "brand_name" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "brand_logo" SET DATA TYPE VARCHAR(256);
