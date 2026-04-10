-- Migration: Change events date columns from DATE to TIMESTAMPTZ
-- Reason: DATE columns silently drop time component, so event times set in admin are lost
-- Existing DATE values become midnight UTC (00:00:00+00:00) which is correct for legacy data

ALTER TABLE events
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ,
  ALTER COLUMN end_date   TYPE TIMESTAMPTZ USING end_date::TIMESTAMPTZ;
