-- This is an empty migration.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_no_active_overlap"
EXCLUDE USING gist (
    "doctor_id" WITH =,
    tstzrange("start_at", "end_at", '[)') WITH &&
)
WHERE ("status" IN ('PENDING', 'CONFIRMED'));