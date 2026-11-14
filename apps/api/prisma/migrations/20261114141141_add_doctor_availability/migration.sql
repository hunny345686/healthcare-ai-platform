/*
  Warnings:

  - You are about to drop the column `end_at` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `start_at` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `endAt` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startAt` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AvailabilityExceptionType" AS ENUM ('CLOSED', 'CUSTOM_HOURS');

-- DropIndex
DROP INDEX "appointments_doctor_id_start_at_idx";

-- DropIndex
DROP INDEX "appointments_patient_id_start_at_idx";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "end_at",
DROP COLUMN "start_at",
ADD COLUMN     "endAt" TIMESTAMPTZ(3) NOT NULL,
ADD COLUMN     "startAt" TIMESTAMPTZ(3) NOT NULL;

-- AlterTable
ALTER TABLE "doctor_profiles" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- CreateTable
CREATE TABLE "doctor_weekly_availability" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "day_of_week" "Weekday" NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "doctor_weekly_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability_exceptions" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type" "AvailabilityExceptionType" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "doctor_availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability_exception_windows" (
    "id" UUID NOT NULL,
    "exception_id" UUID NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_availability_exception_windows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_weekly_availability_doctor_id_day_of_week_start_minu_key" ON "doctor_weekly_availability"("doctor_id", "day_of_week", "start_minute");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_availability_exceptions_doctor_id_date_key" ON "doctor_availability_exceptions"("doctor_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_availability_exception_windows_exception_id_start_mi_key" ON "doctor_availability_exception_windows"("exception_id", "start_minute");

-- CreateIndex
CREATE INDEX "appointments_patient_id_startAt_idx" ON "appointments"("patient_id", "startAt");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_startAt_idx" ON "appointments"("doctor_id", "startAt");

-- AddForeignKey
ALTER TABLE "doctor_weekly_availability" ADD CONSTRAINT "doctor_weekly_availability_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability_exceptions" ADD CONSTRAINT "doctor_availability_exceptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability_exception_windows" ADD CONSTRAINT "doctor_availability_exception_windows_exception_id_fkey" FOREIGN KEY ("exception_id") REFERENCES "doctor_availability_exceptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
