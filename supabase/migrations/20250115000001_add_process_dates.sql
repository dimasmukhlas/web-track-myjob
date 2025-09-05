-- Add process date fields to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN application_sent_date DATE,
ADD COLUMN first_response_date DATE,
ADD COLUMN interview_scheduled_date DATE,
ADD COLUMN interview_completed_date DATE,
ADD COLUMN offer_received_date DATE,
ADD COLUMN offer_deadline_date DATE,
ADD COLUMN rejection_date DATE,
ADD COLUMN withdrawal_date DATE;

-- Create indexes for better performance on process date queries
CREATE INDEX idx_job_applications_application_sent_date ON public.job_applications(application_sent_date);
CREATE INDEX idx_job_applications_first_response_date ON public.job_applications(first_response_date);
CREATE INDEX idx_job_applications_interview_scheduled_date ON public.job_applications(interview_scheduled_date);
CREATE INDEX idx_job_applications_interview_completed_date ON public.job_applications(interview_completed_date);
CREATE INDEX idx_job_applications_offer_received_date ON public.job_applications(offer_received_date);
CREATE INDEX idx_job_applications_offer_deadline_date ON public.job_applications(offer_deadline_date);
CREATE INDEX idx_job_applications_rejection_date ON public.job_applications(rejection_date);
CREATE INDEX idx_job_applications_withdrawal_date ON public.job_applications(withdrawal_date);

-- Add comments to document the new fields
COMMENT ON COLUMN public.job_applications.application_sent_date IS 'Date when the application was actually sent/submitted';
COMMENT ON COLUMN public.job_applications.first_response_date IS 'Date when the company first responded (acknowledgment, screening, etc.)';
COMMENT ON COLUMN public.job_applications.interview_scheduled_date IS 'Date when the interview was scheduled';
COMMENT ON COLUMN public.job_applications.interview_completed_date IS 'Date when the interview was completed';
COMMENT ON COLUMN public.job_applications.offer_received_date IS 'Date when the job offer was received';
COMMENT ON COLUMN public.job_applications.offer_deadline_date IS 'Deadline date for responding to the job offer';
COMMENT ON COLUMN public.job_applications.rejection_date IS 'Date when the application was rejected';
COMMENT ON COLUMN public.job_applications.withdrawal_date IS 'Date when the application was withdrawn';

-- Update existing records to set application_sent_date to application_date for consistency
UPDATE public.job_applications 
SET application_sent_date = application_date 
WHERE application_sent_date IS NULL;
