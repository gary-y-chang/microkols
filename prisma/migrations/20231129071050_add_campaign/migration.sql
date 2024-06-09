/*
  Warnings:

  - Added the required column `style_type` to the `KOL_Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KOL_Profile" ADD COLUMN     "is_dummy" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "style_type" VARCHAR(128) NOT NULL;

-- CreateTable
CREATE TABLE "KOL_Platform" (
    "id" SERIAL NOT NULL,
    "plat_code" SMALLINT NOT NULL,
    "link" VARCHAR(512) NOT NULL,
    "bio" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "plat_identity" VARCHAR(128) NOT NULL,
    "followers_count" INTEGER NOT NULL,
    "posts_count" INTEGER NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "kol_profile_id" INTEGER NOT NULL,

    CONSTRAINT "KOL_Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform_Post" (
    "id" SERIAL NOT NULL,
    "likes_count" INTEGER NOT NULL,
    "comments_count" INTEGER NOT NULL,
    "caption" TEXT,
    "link" VARCHAR(512) NOT NULL,
    "posted_at" DATE NOT NULL,
    "img_high" VARCHAR(256) NOT NULL,
    "img_low" VARCHAR(256) NOT NULL,
    "platform_id" INTEGER NOT NULL,

    CONSTRAINT "Platform_Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "brand_name" TEXT,
    "brand_logo" TEXT,
    "objectives" INTEGER[],
    "platforms" TEXT[],
    "interests" TEXT[],
    "type" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "budget" DECIMAL(16,2) NOT NULL,
    "start_at" DATE NOT NULL,
    "end_at" DATE NOT NULL,
    "invitation_end_at" DATE NOT NULL,
    "title" VARCHAR(128) NOT NULL,
    "description" TEXT NOT NULL,
    "tagline" VARCHAR(256),
    "img_banner" VARCHAR(256),
    "attention_needed" BOOLEAN DEFAULT true,
    "region" TEXT NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggest_KOL_Campaign" (
    "camp_id" INTEGER NOT NULL,
    "profile_id" INTEGER NOT NULL,

    CONSTRAINT "Suggest_KOL_Campaign_pkey" PRIMARY KEY ("camp_id","profile_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KOL_Platform_kol_profile_id_key" ON "KOL_Platform"("kol_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_Post_platform_id_key" ON "Platform_Post"("platform_id");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_creator_id_key" ON "Campaign"("creator_id");

-- AddForeignKey
ALTER TABLE "KOL_Platform" ADD CONSTRAINT "KOL_Platform_kol_profile_id_fkey" FOREIGN KEY ("kol_profile_id") REFERENCES "KOL_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Platform_Post" ADD CONSTRAINT "Platform_Post_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "KOL_Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggest_KOL_Campaign" ADD CONSTRAINT "Suggest_KOL_Campaign_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggest_KOL_Campaign" ADD CONSTRAINT "Suggest_KOL_Campaign_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "KOL_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
