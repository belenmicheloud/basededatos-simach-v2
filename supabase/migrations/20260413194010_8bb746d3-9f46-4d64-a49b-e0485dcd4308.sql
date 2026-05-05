
-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('nuevo', 'en_revision', 'entrevistado', 'rechazado', 'contratado');

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  position TEXT NOT NULL,
  area TEXT NOT NULL,
  experience_summary TEXT NOT NULL,
  cv_path TEXT NOT NULL,
  status public.application_status NOT NULL DEFAULT 'nuevo',
  consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit application" ON public.job_applications
  FOR INSERT WITH CHECK (true);

-- Anyone can read (admin panel - no auth for simplicity)
CREATE POLICY "Anyone can read applications" ON public.job_applications
  FOR SELECT USING (true);

-- Anyone can update status
CREATE POLICY "Anyone can update applications" ON public.job_applications
  FOR UPDATE USING (true);

-- Create private storage bucket for CVs
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false);

-- Anyone can upload CVs
CREATE POLICY "Anyone can upload CVs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cvs');

-- Anyone can read CVs (for signed URL generation)
CREATE POLICY "Anyone can read CVs" ON storage.objects
  FOR SELECT USING (bucket_id = 'cvs');
