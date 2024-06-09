/*
  Warnings:

  - The `audience_age` column on the `KOL_Platform` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `audience_gender` column on the `KOL_Platform` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `audience_region` column on the `KOL_Platform` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "KOL_Platform" DROP COLUMN "audience_age",
ADD COLUMN     "audience_age" JSONB,
DROP COLUMN "audience_gender",
ADD COLUMN     "audience_gender" JSONB,
DROP COLUMN "audience_region",
ADD COLUMN     "audience_region" JSONB;
