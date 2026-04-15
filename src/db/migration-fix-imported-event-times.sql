-- Shift imported future events so their stored wall-clock hour matches
-- the convention used by native admin events. DST-aware:
-- EDT events shift -4h, EST events shift -5h.
-- Run ONCE against production. Running twice will double-shift.

-- Preview: eyeball this list first.
SELECT id, title, start_date, end_date
FROM events
WHERE goodbarber_id IS NOT NULL
  AND start_date >= CURRENT_DATE
  AND all_day = false
ORDER BY start_date
LIMIT 50;

-- The shift.
BEGIN;

UPDATE events
SET
  start_date = (start_date AT TIME ZONE 'America/New_York') AT TIME ZONE 'UTC',
  end_date   = CASE
    WHEN end_date IS NOT NULL
      THEN (end_date AT TIME ZONE 'America/New_York') AT TIME ZONE 'UTC'
    ELSE NULL
  END,
  updated_at = NOW()
WHERE goodbarber_id IS NOT NULL
  AND start_date >= CURRENT_DATE
  AND all_day = false;

COMMIT;
