import { getCurrentUser } from './auth';

// Service to handle user ID mapping between Firebase Auth and Supabase
// Since Supabase expects UUID format, we'll use Firebase UIDs directly
// but we need to ensure the database schema can handle them

export class UserMappingService {
  // Get the current Firebase user ID
  async getCurrentUserId(): Promise<string | null> {
    const user = await getCurrentUser();
    return user?.uid || null;
  }

  // Convert Firebase UID to a format that works with Supabase
  // Firebase UIDs are already strings, so we can use them directly
  // but we need to ensure they're treated as strings in the database
  async getSupabaseUserId(): Promise<string | null> {
    const firebaseUid = await this.getCurrentUserId();
    return firebaseUid;
  }
}

export const userMapping = new UserMappingService();


