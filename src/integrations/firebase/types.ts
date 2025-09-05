import { User as FirebaseUser } from 'firebase/auth';

// Firebase User type (re-export for convenience)
export type User = FirebaseUser;

// Custom session type to match Supabase interface
export interface Session {
  user: User;
  access_token?: string;
  refresh_token?: string;
}

// Auth error type
export interface AuthError {
  message: string;
  code?: string;
}


