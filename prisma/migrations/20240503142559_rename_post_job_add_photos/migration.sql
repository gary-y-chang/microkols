/*
  Warnings:

  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Job";

-- CreateTable
CREATE TABLE "Post_Job" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(512),
    "content" TEXT,
    "photos" TEXT[],
    "assignee_id" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "advice" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cmpgn_id" INTEGER,

    CONSTRAINT "Post_Job_pkey" PRIMARY KEY ("id")
);
