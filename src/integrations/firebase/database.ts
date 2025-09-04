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
      .select('application_date, application_status, updated_at, created_at')
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
      .select('company_name, position_title, application_method')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
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
