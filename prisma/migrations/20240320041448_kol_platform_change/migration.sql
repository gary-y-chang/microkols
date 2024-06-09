/*
  Warnings:

  - You are about to drop the column `bio` on the `KOL_Platform` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `KOL_Platform` table. All the data in the column will be lost.
  - You are about to drop the column `is_private` on the `KOL_Platform` table. All the data in the column will be lost.
  - You are about to drop the column `is_verified` on the `KOL_Platform` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "KOL_Platform" DROP COLUMN "bio",
DROP COLUMN "description",
DROP COLUMN "is_private",
DROP COLUMN "is_verified",
ADD COLUMN     "audience_age" JSONB[],
ADD COLUMN     "audience_gender" JSONB[],
ADD COLUMN     "audience_region" JSONB[],
ADD COLUMN     "is_sync" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "views_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "plat_identity" DROP NOT NULL,
ALTER COLUMN "followers_count" SET DEFAULT 0,
ALTER COLUMN "posts_count" SET DEFAULT 0;
