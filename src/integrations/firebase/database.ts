import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from './auth';

// Database service that uses Firebase Auth for user management
// but still uses Supabase for data operations
export class DatabaseService {
  // Get current Firebase user and return their ID for Supabase
  private async getCurrentUserId(): Promise<string | null> {
    const user = await getCurrentUser();
    return user?.uid || null;
  }

  // Job Applications
  async getJobApplications() {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createJobApplication(applicationData: any) {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .insert({ ...applicationData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateJobApplication(id: string, applicationData: any) {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .update(applicationData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteJobApplication(id: string) {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Analytics and Calendar data
  async getJobApplicationsForAnalytics(startDate: string, endDate: string) {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        application_date, 
        application_status, 
        updated_at, 
        created_at,
        application_sent_date,
        first_response_date,
        interview_scheduled_date,
        interview_completed_date,
        offer_received_date,
        offer_deadline_date,
        rejection_date,
        withdrawal_date
      `)
      .eq('user_id', userId)
      .gte('application_date', startDate)
      .lte('application_date', endDate);

    if (error) throw error;
    return data;
  }

  async getJobApplicationsForCalendar(startDate: string, endDate: string) {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select('application_date, company_name, position_title')
      .eq('user_id', userId)
      .gte('application_date', startDate)
      .lte('application_date', endDate);

    if (error) throw error;
    return data;
  }

  // Autocomplete data
  async getAutocompleteData() {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select('company_name, position_title, application_method, area_of_work')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  // Area of work statistics for radar chart
  async getAreaOfWorkStatistics() {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select('area_of_work, application_status')
      .eq('user_id', userId)
      .not('area_of_work', 'is', null);

    if (error) throw error;
    return data;
  }

  // Process timeline analytics
  async getProcessTimelineAnalytics() {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        application_date,
        application_status,
        application_sent_date,
        first_response_date,
        interview_scheduled_date,
        interview_completed_date,
        offer_received_date,
        offer_deadline_date,
        rejection_date,
        withdrawal_date,
        area_of_work,
        company_name
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  // Find applications with missing data for bulk updates
  async getApplicationsWithMissingData(excludeId?: string) {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    let query = supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter applications that have missing important data
    const applicationsWithMissingData = data?.filter(app => {
      const missingFields = [];
      
      // Check for missing area of work
      if (!app.area_of_work) missingFields.push('area_of_work');
      
      // Check for missing process dates based on status
      if (app.application_status === 'interview' && !app.interview_scheduled_date) {
        missingFields.push('interview_scheduled_date');
      }
      if (app.application_status === 'offer' && !app.offer_received_date) {
        missingFields.push('offer_received_date');
      }
      if (app.application_status === 'rejected' && !app.rejection_date) {
        missingFields.push('rejection_date');
      }
      
      // Check for missing application sent date
      if (!app.application_sent_date) missingFields.push('application_sent_date');
      
      // Check for missing first response if status is not 'applied'
      if (app.application_status !== 'applied' && !app.first_response_date) {
        missingFields.push('first_response_date');
      }

      return missingFields.length > 0;
    }) || [];

    return applicationsWithMissingData;
  }

  // File Storage
  async uploadFile(file: File, path: string) {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${path}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('job-documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('job-documents')
      .getPublicUrl(fileName);

    return { data, publicUrl };
  }
}

// Export singleton instance
export const db = new DatabaseService();
