import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { db } from '@/integrations/firebase/database';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, ChevronDown, ChevronRight, Calendar, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { FileUpload } from '@/components/FileUpload';
import { useAutocompleteData } from '@/hooks/useAutocompleteData';

const formSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  position_title: z.string().min(1, 'Position title is required'),
  area_of_work: z.string().optional(),
  job_description: z.string().optional(),
  application_date: z.string().min(1, 'Application date is required'),
  application_status: z.enum(['applied', 'interview', 'offer', 'rejected', 'withdrawn']),
  job_location: z.string().optional(),
  job_link: z.string().optional(),
  salary_range: z.string().optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance']).optional(),
  work_arrangement: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  application_method: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  follow_up_date: z.string().optional(),
  // Process dates
  application_sent_date: z.string().optional(),
  first_response_date: z.string().optional(),
  interview_scheduled_date: z.string().optional(),
  interview_completed_date: z.string().optional(),
  offer_received_date: z.string().optional(),
  offer_deadline_date: z.string().optional(),
  rejection_date: z.string().optional(),
  withdrawal_date: z.string().optional(),
  cv_file_url: z.string().optional(),
  cv_file_name: z.string().optional(),
  cover_letter_url: z.string().optional(),
  cover_letter_name: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface JobApplicationFormProps {
  onSuccess: () => void;
  editingApplication?: any;
  onCancel?: () => void;
}

export function JobApplicationForm({ onSuccess, editingApplication, onCancel }: JobApplicationFormProps) {
  const [open, setOpen] = useState(!!editingApplication);
  const [loading, setLoading] = useState(false);
  const [processDatesOpen, setProcessDatesOpen] = useState(false);
  const [nextApplication, setNextApplication] = useState<any>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const [missingDataCount, setMissingDataCount] = useState(0);
  const { toast } = useToast();
  const { companies, positions, applicationMethods, areasOfWork, loading: autocompleteLoading } = useAutocompleteData();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: editingApplication ? {
      company_name: editingApplication.company_name,
      position_title: editingApplication.position_title,
      area_of_work: editingApplication.area_of_work || '',
      job_description: editingApplication.job_description || '',
      application_date: editingApplication.application_date,
      application_status: editingApplication.application_status,
      job_location: editingApplication.job_location || '',
      job_link: editingApplication.job_link || '',
      salary_range: editingApplication.salary_range || '',
      job_type: editingApplication.job_type || undefined,
      work_arrangement: editingApplication.work_arrangement || undefined,
      application_method: editingApplication.application_method || '',
      contact_person: editingApplication.contact_person || '',
      contact_email: editingApplication.contact_email || '',
      notes: editingApplication.notes || '',
      follow_up_date: editingApplication.follow_up_date || '',
      // Process dates
      application_sent_date: editingApplication.application_sent_date || '',
      first_response_date: editingApplication.first_response_date || '',
      interview_scheduled_date: editingApplication.interview_scheduled_date || '',
      interview_completed_date: editingApplication.interview_completed_date || '',
      offer_received_date: editingApplication.offer_received_date || '',
      offer_deadline_date: editingApplication.offer_deadline_date || '',
      rejection_date: editingApplication.rejection_date || '',
      withdrawal_date: editingApplication.withdrawal_date || '',
      cv_file_url: editingApplication.cv_file_url || '',
      cv_file_name: editingApplication.cv_file_name || '',
      cover_letter_url: editingApplication.cover_letter_url || '',
      cover_letter_name: editingApplication.cover_letter_name || '',
    } : {
      application_status: 'applied',
      application_date: new Date().toISOString().split('T')[0],
      application_method: 'Company Website',
    },
  });

  // Watch for changes in rejection_date and withdrawal_date to auto-update status
  const rejectionDate = form.watch('rejection_date');
  const withdrawalDate = form.watch('withdrawal_date');

  useEffect(() => {
    // If rejection date is set, automatically set status to rejected
    if (rejectionDate && rejectionDate.trim() !== '') {
      form.setValue('application_status', 'rejected');
      // Clear withdrawal date if rejection date is set
      if (withdrawalDate) {
        form.setValue('withdrawal_date', '');
        toast({
          title: "Status Updated",
          description: "Status automatically set to 'Rejected' and withdrawal date cleared.",
        });
      } else {
        toast({
          title: "Status Updated",
          description: "Status automatically set to 'Rejected' because rejection date is provided.",
        });
      }
    }
    // If withdrawal date is set, automatically set status to withdrawn
    else if (withdrawalDate && withdrawalDate.trim() !== '') {
      form.setValue('application_status', 'withdrawn');
      // Clear rejection date if withdrawal date is set
      if (rejectionDate) {
        form.setValue('rejection_date', '');
        toast({
          title: "Status Updated",
          description: "Status automatically set to 'Withdrawn' and rejection date cleared.",
        });
      } else {
        toast({
          title: "Status Updated",
          description: "Status automatically set to 'Withdrawn' because withdrawal date is provided.",
        });
      }
    }
  }, [rejectionDate, withdrawalDate, form, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    // Auto-update status based on process dates
    let finalStatus = data.application_status;
    let finalRejectionDate = data.rejection_date;
    let finalWithdrawalDate = data.withdrawal_date;

    // If rejection date is set, automatically set status to rejected
    if (data.rejection_date && data.rejection_date.trim() !== '') {
      finalStatus = 'rejected';
      // Clear withdrawal date if rejection date is set
      finalWithdrawalDate = null;
    }
    // If withdrawal date is set, automatically set status to withdrawn
    else if (data.withdrawal_date && data.withdrawal_date.trim() !== '') {
      finalStatus = 'withdrawn';
      // Clear rejection date if withdrawal date is set
      finalRejectionDate = null;
    }
    // If status is changed from rejected/withdrawn to something else, clear the respective date
    else if (data.application_status !== 'rejected' && data.rejection_date) {
      finalRejectionDate = null;
    }
    else if (data.application_status !== 'withdrawn' && data.withdrawal_date) {
      finalWithdrawalDate = null;
    }

    const applicationData = {
      company_name: data.company_name,
      position_title: data.position_title,
      area_of_work: data.area_of_work || null,
      job_description: data.job_description || null,
      application_date: data.application_date,
      application_status: finalStatus,
      job_location: data.job_location || null,
      job_link: data.job_link || null,
      salary_range: data.salary_range || null,
      job_type: data.job_type || null,
      work_arrangement: data.work_arrangement || null,
      application_method: data.application_method || null,
      contact_person: data.contact_person || null,
      contact_email: data.contact_email || null,
      notes: data.notes || null,
      follow_up_date: data.follow_up_date || null,
      // Process dates
      application_sent_date: data.application_sent_date || null,
      first_response_date: data.first_response_date || null,
      interview_scheduled_date: data.interview_scheduled_date || null,
      interview_completed_date: data.interview_completed_date || null,
      offer_received_date: data.offer_received_date || null,
      offer_deadline_date: data.offer_deadline_date || null,
      rejection_date: finalRejectionDate || null,
      withdrawal_date: finalWithdrawalDate || null,
      cv_file_url: data.cv_file_url || null,
      cv_file_name: data.cv_file_name || null,
      cover_letter_url: data.cover_letter_url || null,
      cover_letter_name: data.cover_letter_name || null,
    };

    try {
      if (editingApplication) {
        await db.updateJobApplication(editingApplication.id, applicationData);
      } else {
        await db.createJobApplication(applicationData);
      }
      
      toast({
        title: 'Success',
        description: `Job application ${editingApplication ? 'updated' : 'added'} successfully!`,
      });
      
      // If we have a next application queued, load it automatically
      if (nextApplication) {
        // Update the current editing application to the next one
        const nextApp = nextApplication;
        setNextApplication(null);
        
        // Update form with next application data
        form.reset({
          company_name: nextApp.company_name,
          position_title: nextApp.position_title,
          area_of_work: nextApp.area_of_work || '',
          job_description: nextApp.job_description || '',
          application_date: nextApp.application_date,
          application_status: nextApp.application_status,
          job_location: nextApp.job_location || '',
          job_link: nextApp.job_link || '',
          salary_range: nextApp.salary_range || '',
          job_type: nextApp.job_type || undefined,
          work_arrangement: nextApp.work_arrangement || undefined,
          application_method: nextApp.application_method || '',
          contact_person: nextApp.contact_person || '',
          contact_email: nextApp.contact_email || '',
          notes: nextApp.notes || '',
          follow_up_date: nextApp.follow_up_date || '',
          // Process dates
          application_sent_date: nextApp.application_sent_date || '',
          first_response_date: nextApp.first_response_date || '',
          interview_scheduled_date: nextApp.interview_scheduled_date || '',
          interview_completed_date: nextApp.interview_completed_date || '',
          offer_received_date: nextApp.offer_received_date || '',
          offer_deadline_date: nextApp.offer_deadline_date || '',
          rejection_date: nextApp.rejection_date || '',
          withdrawal_date: nextApp.withdrawal_date || '',
          cv_file_url: nextApp.cv_file_url || '',
          cv_file_name: nextApp.cv_file_name || '',
          cover_letter_url: nextApp.cover_letter_url || '',
          cover_letter_name: nextApp.cover_letter_name || '',
        });

        // Update the editing application reference
        if (onSuccess) {
          onSuccess(); // This will trigger a re-render with the new application
        }

        toast({
          title: 'Next Application Loaded',
          description: `Now editing ${nextApp.company_name} - ${nextApp.position_title}`,
        });
      } else {
        form.reset();
        setOpen(false);
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingApplication ? 'update' : 'save'} job application. Please try again.`,
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  // Load next application with missing data
  const loadNextApplication = async () => {
    setLoadingNext(true);
    try {
      const applicationsWithMissingData = await db.getApplicationsWithMissingData(editingApplication?.id);
      setMissingDataCount(applicationsWithMissingData.length);
      
      if (applicationsWithMissingData.length > 0) {
        const nextApp = applicationsWithMissingData[0];
        setNextApplication(nextApp);
        
        // Update form with next application data
        form.reset({
          company_name: nextApp.company_name,
          position_title: nextApp.position_title,
          area_of_work: nextApp.area_of_work || '',
          job_description: nextApp.job_description || '',
          application_date: nextApp.application_date,
          application_status: nextApp.application_status,
          job_location: nextApp.job_location || '',
          job_link: nextApp.job_link || '',
          salary_range: nextApp.salary_range || '',
          job_type: nextApp.job_type || undefined,
          work_arrangement: nextApp.work_arrangement || undefined,
          application_method: nextApp.application_method || '',
          contact_person: nextApp.contact_person || '',
          contact_email: nextApp.contact_email || '',
          notes: nextApp.notes || '',
          follow_up_date: nextApp.follow_up_date || '',
          // Process dates
          application_sent_date: nextApp.application_sent_date || '',
          first_response_date: nextApp.first_response_date || '',
          interview_scheduled_date: nextApp.interview_scheduled_date || '',
          interview_completed_date: nextApp.interview_completed_date || '',
          offer_received_date: nextApp.offer_received_date || '',
          offer_deadline_date: nextApp.offer_deadline_date || '',
          rejection_date: nextApp.rejection_date || '',
          withdrawal_date: nextApp.withdrawal_date || '',
          cv_file_url: nextApp.cv_file_url || '',
          cv_file_name: nextApp.cv_file_name || '',
          cover_letter_url: nextApp.cover_letter_url || '',
          cover_letter_name: nextApp.cover_letter_name || '',
        });

        toast({
          title: 'Next Application Loaded',
          description: `Loaded ${nextApp.company_name} - ${nextApp.position_title}`,
        });
      } else {
        toast({
          title: 'All Done!',
          description: 'No more applications with missing data found.',
        });
        setNextApplication(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load next application.',
        variant: 'destructive',
      });
    } finally {
      setLoadingNext(false);
    }
  };

  // Load missing data count when component mounts or editingApplication changes
  useEffect(() => {
    const loadMissingDataCount = async () => {
      try {
        const applicationsWithMissingData = await db.getApplicationsWithMissingData(editingApplication?.id);
        setMissingDataCount(applicationsWithMissingData.length);
      } catch (error) {
        console.error('Error loading missing data count:', error);
      }
    };

    if (editingApplication) {
      loadMissingDataCount();
    }
  }, [editingApplication]);

  // Close dialog when editingApplication changes to null
  useEffect(() => {
    if (editingApplication) {
      setOpen(true);
    } else if (onCancel) {
      setOpen(false);
    }
  }, [editingApplication, onCancel]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!editingApplication && (
        <DialogTrigger asChild>
          <Button className="apple-button bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-6 rounded-xl shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        </DialogTrigger>
      )}
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-0 shadow-2xl"
        aria-describedby="job-application-form-description"
      >
        <DialogHeader className="space-y-4 pb-6">
          <DialogTitle className="text-2xl font-bold apple-heading text-gray-900">
            {editingApplication ? 'Edit Job Application' : 'Add New Job Application'}
          </DialogTitle>
          <p className="text-gray-600 apple-text">
            {editingApplication ? 'Update your job application details' : 'Track your next job application with all the important details'}
          </p>
          <p id="job-application-form-description" className="sr-only">
            {editingApplication ? 'Edit the details of your job application' : 'Fill out the form to add a new job application to your tracking list'}
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Company Name *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={companies}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select or enter company name..."
                        searchPlaceholder="Search companies..."
                        emptyText="No companies found."
                        allowCustom={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Position Title *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={positions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select or enter position title..."
                        searchPlaceholder="Search positions..."
                        emptyText="No positions found."
                        allowCustom={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="area_of_work"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Area of Work</FormLabel>
                  <FormControl>
                    <Combobox
                      options={areasOfWork}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select or enter area of work..."
                      searchPlaceholder="Search areas of work..."
                      emptyText="No areas of work found."
                      allowCustom={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter job description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="application_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="application_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                    {(rejectionDate && rejectionDate.trim() !== '') && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Status automatically set to "Rejected" because rejection date is provided
                      </p>
                    )}
                    {(withdrawalDate && withdrawalDate.trim() !== '') && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Status automatically set to "Withdrawn" because withdrawal date is provided
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="job_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter job location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="job_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/job-posting" {...field} type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="salary_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary Range</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., $50,000 - $70,000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="job_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="work_arrangement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Arrangement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select arrangement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">Onsite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="follow_up_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Process Dates Section */}
            <Collapsible open={processDatesOpen} onOpenChange={setProcessDatesOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Process Timeline Dates
                  </div>
                  {processDatesOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">
                    Track important dates throughout your application process. These dates help you understand timing patterns and improve your job search strategy.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="application_sent_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Application Sent Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="first_response_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">First Response Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="interview_scheduled_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Interview Scheduled Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="interview_completed_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Interview Completed Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="offer_received_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Offer Received Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="offer_deadline_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Offer Deadline Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rejection_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Rejection Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="withdrawal_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Withdrawal Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact person" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter contact email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="application_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Method</FormLabel>
                  <FormControl>
                    <Combobox
                      options={applicationMethods}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select application method..."
                      searchPlaceholder="Search methods..."
                      emptyText="No methods found."
                      allowCustom={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cv_file_url"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload
                        label="CV/Resume"
                        onFileUploaded={(url, name) => {
                          field.onChange(url);
                          form.setValue('cv_file_name', name);
                        }}
                        onFileRemoved={() => {
                          field.onChange('');
                          form.setValue('cv_file_name', '');
                        }}
                        currentFile={field.value ? { url: field.value, name: form.getValues('cv_file_name') || 'CV' } : null}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cover_letter_url"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload
                        label="Cover Letter"
                        onFileUploaded={(url, name) => {
                          field.onChange(url);
                          form.setValue('cover_letter_name', name);
                        }}
                        onFileRemoved={() => {
                          field.onChange('');
                          form.setValue('cover_letter_name', '');
                        }}
                        currentFile={field.value ? { url: field.value, name: form.getValues('cover_letter_name') || 'Cover Letter' } : null}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress Indicator and Next Application Button */}
            {editingApplication && (
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {missingDataCount > 0 ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-gray-600">
                          {missingDataCount} application{missingDataCount !== 1 ? 's' : ''} with missing data
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">All applications are complete!</span>
                      </>
                    )}
                  </div>
                  {missingDataCount > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={loadNextApplication}
                      disabled={loadingNext}
                      className="apple-button border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-700 h-10 px-4"
                    >
                      {loadingNext ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Next Application
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                className="apple-button border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 h-11 px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="apple-button bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-6"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingApplication ? 'Update Application' : 'Add Application'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}