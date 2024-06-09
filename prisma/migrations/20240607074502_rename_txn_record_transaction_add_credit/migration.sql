/*
  Warnings:

  - You are about to drop the `Txn_Record` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "kol_required" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "Campaign_Apply" ADD COLUMN     "selected" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Txn_Record";

-- CreateTable
CREATE TABLE "Transaction" (
    "id" VARCHAR(64) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "note" VARCHAR(128),
    "camp_id" INTEGER,
    "account_no" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit_Account" (
    "account_no" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "balance" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "total_top_up" DECIMAL(16,2),
    "total_expense" DECIMAL(16,2),
    "total_reward" DECIMAL(16,2),
    "total_withdraw" DECIMAL(16,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_Account_pkey" PRIMARY KEY ("account_no")
);
