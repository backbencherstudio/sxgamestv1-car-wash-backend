/*
  Warnings:

  - A unique constraint covering the columns `[stripe_subscription_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
