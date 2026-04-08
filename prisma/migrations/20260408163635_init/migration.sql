/*
  Warnings:

  - Added the required column `rpa` to the `Neighborhood` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Neighborhood" ADD COLUMN     "rpa" INTEGER NOT NULL;
