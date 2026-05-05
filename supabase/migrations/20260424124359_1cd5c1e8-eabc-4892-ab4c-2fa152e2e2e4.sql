CREATE TABLE public.job_openings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position TEXT NOT NULL,
  area TEXT NOT NULL,
  branch TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job openings"
ON public.job_openings FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert job openings"
ON public.job_openings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update job openings"
ON public.job_openings FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete job openings"
ON public.job_openings FOR DELETE
USING (true);

CREATE INDEX idx_job_openings_active ON public.job_openings(is_active, created_at DESC);