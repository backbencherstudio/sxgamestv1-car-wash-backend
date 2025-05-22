-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" SMALLINT DEFAULT 1,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "available_time" TEXT NOT NULL,
    "team_size" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "is_mobile" BOOLEAN NOT NULL DEFAULT false,
    "is_garage" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);
