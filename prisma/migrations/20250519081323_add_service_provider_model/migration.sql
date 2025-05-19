-- CreateTable
CREATE TABLE "service_providers" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" SMALLINT DEFAULT 1,
    "business_name" TEXT NOT NULL,
    "business_number" TEXT NOT NULL,
    "profile_picture" TEXT,
    "license_front" TEXT NOT NULL,
    "license_back" TEXT NOT NULL,
    "nid_number" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "business_location" TEXT NOT NULL,
    "permanent_address" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_user_id_key" ON "service_providers"("user_id");

-- AddForeignKey
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
