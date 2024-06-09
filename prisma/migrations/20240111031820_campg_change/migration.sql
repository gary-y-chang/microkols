/*
  Warnings:

  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Campaign_creator_id_key";

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'draft',
ALTER COLUMN "budget" DROP NOT NULL,
ALTER COLUMN "start_at" DROP NOT NULL,
ALTER COLUMN "end_at" DROP NOT NULL,
ALTER COLUMN "invitation_end_at" DROP NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "region" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "country",
ADD COLUMN     "country_code" VARCHAR(6);
