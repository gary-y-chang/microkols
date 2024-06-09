-- AlterTable
ALTER TABLE "KOL_Platform" ALTER COLUMN "plat_code" SET DATA TYPE VARCHAR(32);

-- CreateTable
CREATE TABLE "Campaign_Product" (
    "id" SERIAL NOT NULL,
    "type" SMALLINT NOT NULL DEFAULT 1,
    "name" VARCHAR(64) NOT NULL,
    "ref_url" VARCHAR(256),
    "value" DECIMAL(16,2) NOT NULL,
    "remark" TEXT NOT NULL,
    "img" VARCHAR(256),
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "camp_id" INTEGER NOT NULL,

    CONSTRAINT "Campaign_Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign_Event" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "ref_url" VARCHAR(256),
    "img" VARCHAR(256),
    "camp_id" INTEGER NOT NULL,

    CONSTRAINT "Campaign_Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign_Task" (
    "id" SERIAL NOT NULL,
    "plat_code" VARCHAR(8) NOT NULL,
    "post_type" VARCHAR(16) NOT NULL,
    "submit_date" TIMESTAMP(3) NOT NULL,
    "quantity" SMALLINT NOT NULL DEFAULT 1,
    "brand_mention" VARCHAR(128),
    "brand_hashtag" VARCHAR(128),
    "campaign_hashtag" VARCHAR(128),
    "suggest_content" VARCHAR(512),
    "post_request" TEXT NOT NULL,
    "img" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "camp_id" INTEGER NOT NULL,

    CONSTRAINT "Campaign_Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign_KOL_Type" (
    "id" SERIAL NOT NULL,
    "plat_code" VARCHAR(8) NOT NULL,
    "age_range" INTEGER[] DEFAULT ARRAY[20, 55]::INTEGER[],
    "follower_range" INTEGER[] DEFAULT ARRAY[10, 10000]::INTEGER[],
    "pay_range" DECIMAL(16,2)[] DEFAULT ARRAY[0.00, 1000.00]::DECIMAL(16,2)[],
    "kol_numbers" SMALLINT NOT NULL,
    "gender" VARCHAR(16) NOT NULL,
    "request" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "camp_id" INTEGER NOT NULL,

    CONSTRAINT "Campaign_KOL_Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign_Dos_Donts" (
    "id" SERIAL NOT NULL,
    "type" SMALLINT NOT NULL DEFAULT 1,
    "request" VARCHAR(128) NOT NULL,
    "img" VARCHAR(256),
    "camp_id" INTEGER NOT NULL,

    CONSTRAINT "Campaign_Dos_Donts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Campaign_Product" ADD CONSTRAINT "Campaign_Product_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign_Event" ADD CONSTRAINT "Campaign_Event_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign_Task" ADD CONSTRAINT "Campaign_Task_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign_KOL_Type" ADD CONSTRAINT "Campaign_KOL_Type_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign_Dos_Donts" ADD CONSTRAINT "Campaign_Dos_Donts_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
