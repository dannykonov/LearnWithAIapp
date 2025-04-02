import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Import your Firebase auth instance

// Define the shape of the context data
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

// Custom hook to use the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until auth state is confirmed

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Auth state confirmed, stop loading
      console.log("Auth State Changed:", user ? `Logged in as ${user.email}` : "Logged out"); // Temporary log
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Empty dependency array ensures this runs only once on mount

  // Value provided by the context
  const value = {
    currentUser,
    loading,
  };

  // Render children only when not loading, or handle loading state as needed
  // For simplicity now, we provide the value immediately.
  // You might want to show a loading spinner based on the `loading` state elsewhere.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 