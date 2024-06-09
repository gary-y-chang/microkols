-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" VARCHAR(64);

-- CreateTable
CREATE TABLE "Txn_Record" (
    "id" VARCHAR(64) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "description" VARCHAR(128),
    "camp_id" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Txn_Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account_Sync" (
    "user_id" INTEGER NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "platform" VARCHAR(32) NOT NULL,
    "access_token" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Account_Sync_pkey" PRIMARY KEY ("user_id","platform_id")
);
