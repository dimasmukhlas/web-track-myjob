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
import { db } from '@/integrations/firebase/database';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { FileUpload } from '@/components/FileUpload';
import { useAutocompleteData } from '@/hooks/useAutocompleteData';

const formSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  position_title: z.string().min(1, 'Position title is required'),
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
  const { toast } = useToast();
  const { companies, positions, applicationMethods, loading: autocompleteLoading } = useAutocompleteData();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: editingApplication ? {
      company_name: editingApplication.company_name,
      position_title: editingApplication.position_title,
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

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const applicationData = {
      company_name: data.company_name,
      position_title: data.position_title,
      job_description: data.job_description || null,
      application_date: data.application_date,
      application_status: data.application_status,
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
      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingApplication ? 'update' : 'save'} job application. Please try again.`,
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

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