-- Rename appointment timestamp columns without losing data.
ALTER TABLE "appointments"
RENAME COLUMN "startAt" TO "start_at";

ALTER TABLE "appointments"
RENAME COLUMN "endAt" TO "end_at";

-- Recreate indexes using the corrected column names.
DROP INDEX IF EXISTS "appointments_patient_id_startAt_idx";
DROP INDEX IF EXISTS "appointments_doctor_id_startAt_idx";

CREATE INDEX "appointments_patient_id_start_at_idx"
ON "appointments"("patient_id", "start_at");

CREATE INDEX "appointments_doctor_id_start_at_idx"
ON "appointments"("doctor_id", "start_at");

-- Validate recurring weekly working periods.
ALTER TABLE "doctor_weekly_availability"
ADD CONSTRAINT "doctor_weekly_availability_valid_time_check"
CHECK (
    "start_minute" >= 0
    AND "end_minute" <= 1440
    AND "start_minute" < "end_minute"
);

-- Validate date-specific working periods.
ALTER TABLE "doctor_availability_exception_windows"
ADD CONSTRAINT "doctor_availability_exception_windows_valid_time_check"
CHECK (
    "start_minute" >= 0
    AND "end_minute" <= 1440
    AND "start_minute" < "end_minute"
);