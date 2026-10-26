-- Safe to run more than once. Stores the single public next-mission setting.
CREATE TABLE IF NOT EXISTS mission_countdowns (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  title VARCHAR(120) NOT NULL,
  target_at TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
  description VARCHAR(220) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade the earlier starter-table version, which stored only target_date.
-- These statements are non-destructive and can be run repeatedly.
ALTER TABLE mission_countdowns
  ADD COLUMN IF NOT EXISTS target_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(80) DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE mission_countdowns
SET timezone = 'Asia/Kolkata'
WHERE timezone IS NULL OR btrim(timezone) = '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'mission_countdowns'
      AND column_name = 'target_date'
  ) THEN
    EXECUTE $upgrade$
      UPDATE mission_countdowns
      SET target_at = (target_date::timestamp AT TIME ZONE timezone)
      WHERE target_at IS NULL
    $upgrade$;
  END IF;
END $$;

UPDATE mission_countdowns
SET target_at = TIMESTAMPTZ '2026-12-14 18:30:00+00'
WHERE target_at IS NULL;

ALTER TABLE mission_countdowns
  ALTER COLUMN target_at SET NOT NULL,
  ALTER COLUMN timezone SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

INSERT INTO mission_countdowns (id, title, target_at, timezone, description, is_active)
VALUES (
  1,
  'INTER-IIT ATHLETICS MEET 2026',
  TIMESTAMPTZ '2026-12-14 18:30:00+00',
  'Asia/Kolkata',
  'The next mission starts here.',
  TRUE
)
ON CONFLICT (id) DO NOTHING;
