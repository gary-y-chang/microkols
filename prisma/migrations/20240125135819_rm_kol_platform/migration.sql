/*
  Warnings:

  - You are about to drop the `Suggest_KOL_Campaign` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Suggest_KOL_Campaign" DROP CONSTRAINT "Suggest_KOL_Campaign_camp_id_fkey";

-- DropForeignKey
ALTER TABLE "Suggest_KOL_Campaign" DROP CONSTRAINT "Suggest_KOL_Campaign_profile_id_fkey";

-- DropIndex
DROP INDEX "KOL_Platform_kol_profile_id_key";

-- DropTable
DROP TABLE "Suggest_KOL_Campaign";

-- CreateTable
CREATE TABLE "Campaign_KOL_Invitation" (
    "camp_id" INTEGER NOT NULL,
    "profile_id" INTEGER NOT NULL,

    CONSTRAINT "Campaign_KOL_Invitation_pkey" PRIMARY KEY ("camp_id","profile_id")
);

-- AddForeignKey
ALTER TABLE "Campaign_KOL_Invitation" ADD CONSTRAINT "Campaign_KOL_Invitation_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign_KOL_Invitation" ADD CONSTRAINT "Campaign_KOL_Invitation_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "KOL_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
