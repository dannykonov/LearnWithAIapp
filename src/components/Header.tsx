import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link to="/" className="flex items-center">
          <Logo size="sm" />
        </Link>

        <nav className="flex items-center gap-4">
          {currentUser ? (
            <>
              <Link to="/roadmaps">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  My Roadmaps
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
              )}
              {location.pathname !== '/signup' && (
                <Link to="/signup">
                  <Button variant="default" size="sm">
                    Sign Up
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 