-- CreateTable
CREATE TABLE "service_bookings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "service_type" TEXT NOT NULL,
    "service_timing" TEXT NOT NULL DEFAULT 'scheduled',
    "location" TEXT NOT NULL,
    "schedule_date" TEXT NOT NULL,
    "schedule_time" TEXT NOT NULL,
    "schedule_datetime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_bookings_pkey" PRIMARY KEY ("id")
);
