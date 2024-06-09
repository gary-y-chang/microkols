-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_name" VARCHAR(128) NOT NULL,
    "sender_icon" VARCHAR(256) NOT NULL,
    "message" VARCHAR(512) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
