-- A professional's can_work_evening/_weekend/_night has had nothing on the
-- case side to compare against — added so admin can state when a case
-- actually needs coverage outside normal daytime hours, and matching can
-- weigh it the same way it already weighs transport/gender/geography.
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS requires_evening  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_weekend  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_night    BOOLEAN NOT NULL DEFAULT false;
