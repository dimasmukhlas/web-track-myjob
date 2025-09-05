import { auth } from './config';
import { User } from 'firebase/auth';

// Helper function to get current user
export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Helper function to get current user synchronously
export const getCurrentUserSync = (): User | null => {
  return auth.currentUser;
};


