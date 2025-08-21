-- Add file-related columns to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN cv_file_url TEXT,
ADD COLUMN cv_file_name TEXT,
ADD COLUMN cover_letter_url TEXT,
ADD COLUMN cover_letter_name TEXT;

-- Create storage bucket for job documents
INSERT INTO storage.buckets (id, name, public) VALUES ('job-documents', 'job-documents', false);

-- Create storage policies for job documents
CREATE POLICY "Users can view their own job documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own job documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own job documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own job documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);