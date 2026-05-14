-- AlterTable
ALTER TABLE "AlertLog" ADD COLUMN     "forecastTide" DOUBLE PRECISION,
ADD COLUMN     "riverTendencia" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
