/*
  Warnings:

  - You are about to drop the column `acct_id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[account_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_acct_id_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "acct_id",
ADD COLUMN     "account_id" VARCHAR(64),
ADD COLUMN     "auth_by" VARCHAR(16),
ADD COLUMN     "company_name" VARCHAR(32);

-- CreateIndex
CREATE UNIQUE INDEX "User_account_id_key" ON "User"("account_id");
