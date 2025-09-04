import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7kwDSTeMNGCTwug2vZHhWmGlQkVJ9Wwc",
  authDomain: "jobtracking-94a69.firebaseapp.com",
  projectId: "jobtracking-94a69",
  storageBucket: "jobtracking-94a69.firebasestorage.app",
  messagingSenderId: "346597803292",
  appId: "1:346597803292:web:8e0f928e820656756f66d9",
  measurementId: "G-K7T0WZTNEN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
