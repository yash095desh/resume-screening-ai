/*
  Warnings:

  - You are about to drop the column `discoveredUrlsCreatedAt` on the `SourcingJob` table. All the data in the column will be lost.
  - You are about to drop the column `lastParsedBatch` on the `SourcingJob` table. All the data in the column will be lost.
  - You are about to drop the column `lastSavedBatch` on the `SourcingJob` table. All the data in the column will be lost.
  - You are about to drop the column `lastScoredBatch` on the `SourcingJob` table. All the data in the column will be lost.
  - You are about to drop the column `lastScrapedBatch` on the `SourcingJob` table. All the data in the column will be lost.
  - You are about to drop the column `retryAfter` on the `SourcingJob` table. All the data in the column will be lost.
  - You are about to drop the column `searchFiltersCreatedAt` on the `SourcingJob` table. All the data in the column will be lost.
  - You are about to drop the column `totalBatches` on the `SourcingJob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SourcingJob" DROP COLUMN "discoveredUrlsCreatedAt",
DROP COLUMN "lastParsedBatch",
DROP COLUMN "lastSavedBatch",
DROP COLUMN "lastScoredBatch",
DROP COLUMN "lastScrapedBatch",
DROP COLUMN "retryAfter",
DROP COLUMN "searchFiltersCreatedAt",
DROP COLUMN "totalBatches";
