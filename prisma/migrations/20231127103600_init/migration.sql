-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "acct_id" VARCHAR(36) NOT NULL,
    "email" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "phone" VARCHAR(16),
    "country" VARCHAR(16),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KOL_Profile" (
    "id" SERIAL NOT NULL,
    "stage_name" VARCHAR(128),
    "age" SMALLINT,
    "gender" CHAR(1),
    "bio" TEXT,
    "birthdate" DATE,
    "img" VARCHAR(256) NOT NULL,
    "region" VARCHAR(64) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "KOL_Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_acct_id_key" ON "User"("acct_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KOL_Profile_user_id_key" ON "KOL_Profile"("user_id");

-- AddForeignKey
ALTER TABLE "KOL_Profile" ADD CONSTRAINT "KOL_Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
