/*
  Warnings:

  - You are about to alter the column `caption` on the `Platform_Post` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.

*/
-- AlterTable
ALTER TABLE "Platform_Post" ADD COLUMN     "content" TEXT,
ALTER COLUMN "likes_count" SET DEFAULT 0,
ALTER COLUMN "comments_count" SET DEFAULT 0,
ALTER COLUMN "caption" SET DATA TYPE VARCHAR(256);
