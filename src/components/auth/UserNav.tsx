// src/components/auth/UserNav.tsx
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface UserNavProps {
  user: {
    id: string;
    email: string;
  };
}

export default function UserNav({ user }: UserNavProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Get token for Authorization header (optional, but good practice)
      const token = 
        localStorage.getItem('sb-access-token') || 
        sessionStorage.getItem('sb-access-token');

      // Call logout API endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      // Clear all auth data from storage
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      sessionStorage.removeItem('sb-access-token');
      sessionStorage.removeItem('sb-refresh-token');

      // Redirect to login page
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, clear storage and redirect
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      sessionStorage.removeItem('sb-access-token');
      sessionStorage.removeItem('sb-refresh-token');
      window.location.href = '/auth/login';
    }
  };

  // Generate initials from email (first 2 chars before @)
  const initials = user.email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {user.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  Zalogowany
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-2">
              <a 
                href="/generate"
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Generuj
              </a>
              <a 
                href="/flashcards"
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Moje Fiszki
              </a>
              <a 
                href="/study"
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Nauka
              </a>
            </nav>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="min-w-[100px]"
          >
            {isLoggingOut ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Wylogowywanie...
              </>
            ) : (
              'Wyloguj'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
