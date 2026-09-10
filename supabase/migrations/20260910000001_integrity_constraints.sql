-- Integrity: daily max 10 hours per professional per day (across all entries)
CREATE OR REPLACE FUNCTION check_daily_hours_limit()
RETURNS TRIGGER AS $$
DECLARE
  daily_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(hours), 0) INTO daily_total
  FROM registered_hours
  WHERE professional_id = NEW.professional_id
    AND work_date = NEW.work_date
    AND archived_at IS NULL
    AND (TG_OP = 'INSERT' OR id != NEW.id);

  IF (daily_total + NEW.hours) > 10 THEN
    RAISE EXCEPTION 'Max 10 timer per dag: %.2f timer allerede registreret %', daily_total, NEW.work_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_daily_hours_limit ON registered_hours;
CREATE TRIGGER enforce_daily_hours_limit
  BEFORE INSERT OR UPDATE OF hours, work_date ON registered_hours
  FOR EACH ROW EXECUTE FUNCTION check_daily_hours_limit();
