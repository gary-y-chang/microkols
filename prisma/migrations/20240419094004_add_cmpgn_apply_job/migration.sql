/*
  Warnings:

  - You are about to drop the column `comments_count` on the `Platform_Post` table. All the data in the column will be lost.
  - You are about to drop the column `likes_count` on the `Platform_Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Platform_Post" DROP COLUMN "comments_count",
DROP COLUMN "likes_count",
ADD COLUMN     "engagement" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reach" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "selected" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Campaign_Apply" (
    "cmpgn_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "apply_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approve_date" TIMESTAMP(3),
    "done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Campaign_Apply_pkey" PRIMARY KEY ("cmpgn_id","user_id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(512),
    "content" TEXT,
    "assignee_id" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "advice" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cmpgn_id" INTEGER,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
