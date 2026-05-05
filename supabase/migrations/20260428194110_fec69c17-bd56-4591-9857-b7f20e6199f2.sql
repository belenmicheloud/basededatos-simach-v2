ALTER TABLE public.job_openings
  ADD COLUMN IF NOT EXISTS requirements text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS schedule_type text,
  ADD COLUMN IF NOT EXISTS work_mode text;