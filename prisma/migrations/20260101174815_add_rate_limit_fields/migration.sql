/*
  Warnings:

  - You are about to drop the column `rateLimitType` on the `SourcingJob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SourcingJob" DROP COLUMN "rateLimitType",
ADD COLUMN     "rateLimitService" TEXT;
