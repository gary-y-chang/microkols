/*
  Warnings:

  - The primary key for the `Post_Job` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `advice` on the `Post_Job` table. All the data in the column will be lost.
  - You are about to drop the column `assignee_id` on the `Post_Job` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Post_Job` table. All the data in the column will be lost.
  - Added the required column `author_id` to the `Post_Job` table without a default value. This is not possible if the table is not empty.
  - Made the column `cmpgn_id` on table `Post_Job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Post_Job" DROP CONSTRAINT "Post_Job_pkey",
DROP COLUMN "advice",
DROP COLUMN "assignee_id",
DROP COLUMN "id",
ADD COLUMN     "author_id" INTEGER NOT NULL,
ADD COLUMN     "comment_1" TEXT,
ADD COLUMN     "comment_2" TEXT,
ADD COLUMN     "launch_image" VARCHAR(256),
ADD COLUMN     "launch_link" VARCHAR(256),
ADD COLUMN     "procedure" INTEGER[] DEFAULT ARRAY[1, 0, 0, 0, 0, 0]::INTEGER[],
ALTER COLUMN "cmpgn_id" SET NOT NULL,
ADD CONSTRAINT "Post_Job_pkey" PRIMARY KEY ("author_id", "cmpgn_id");
