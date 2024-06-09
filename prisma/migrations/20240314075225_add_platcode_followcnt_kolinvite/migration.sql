-- AlterTable
ALTER TABLE "Campaign_KOL_Invitation" ADD COLUMN     "followers_count" INTEGER NOT NULL DEFAULT 3200,
ADD COLUMN     "plat_code" VARCHAR(32) NOT NULL DEFAULT 'FB';
