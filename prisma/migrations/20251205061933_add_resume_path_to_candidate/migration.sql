/*
  Warnings:

  - Added the required column `resumePath` to the `candidates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "resumePath" TEXT NOT NULL;
