-- Add area_of_work column to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN area_of_work TEXT;

-- Create index for better performance on area_of_work queries
CREATE INDEX idx_job_applications_area_of_work ON public.job_applications(area_of_work);

-- Add comment to document the field
COMMENT ON COLUMN public.job_applications.area_of_work IS 'Area of work/industry for the job application (e.g., Finance, Product Manager, Project Manager)';
