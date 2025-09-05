import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from './auth';

// Custom Supabase client that works with Firebase Auth
const SUPABASE_URL = "https://usmnmvfxmjwzggrbhmle.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbW5tdmZ4bWp3emdncmJobWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjE1MjIsImV4cCI6MjA3MTA5NzUyMn0.BGGO2ze_M543RGHVq5ab0iC9DrGaayP_iF4jn69SKhM";

// Create the base Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Custom Supabase client that sets the Firebase user ID in the request context
export class FirebaseSupabaseClient {
  private async setUserContext() {
    const user = await getCurrentUser();
    if (user) {
      // Set the current user ID in the request context
      // This will be used by the RLS policies
      await supabase.rpc('set_current_user_id', { user_id: user.uid });
    }
  }

  // Wrapper methods that set user context before making requests
  async from(table: string) {
    await this.setUserContext();
    return supabase.from(table);
  }

  async storage() {
    await this.setUserContext();
    return supabase.storage;
  }

  async rpc(fn: string, params?: any) {
    await this.setUserContext();
    return supabase.rpc(fn, params);
  }

  // Expose other methods as needed
  get auth() {
    return supabase.auth;
  }
}

// Export singleton instance
export const firebaseSupabase = new FirebaseSupabaseClient();


