ALTER TABLE public.job_applications
ADD COLUMN opening_id uuid REFERENCES public.job_openings(id) ON DELETE SET NULL;

CREATE INDEX idx_job_applications_opening_id ON public.job_applications(opening_id);