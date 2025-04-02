import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react'; // Optional: Use a loader

const ProtectedRoute: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optional: Show a full-page loader while checking auth status
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-lwai-deepBlue" />
      </div>
    );
  }

  if (!currentUser) {
    // User not logged in, redirect to login page
    // Pass the current location to redirect back after login (optional)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, render the child route component
  return <Outlet />; // Outlet renders the matched child route element
};

export default ProtectedRoute; 