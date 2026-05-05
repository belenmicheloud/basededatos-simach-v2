ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'contactado';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'descartado';

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hired_at date;