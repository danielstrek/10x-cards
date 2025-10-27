// src/components/auth/UserNav.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface User {
  id: string;
  email: string;
}

interface UserNavProps {
  user: User;
}

export default function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get user initials from email
  const getInitials = (email: string): string => {
    return email.substring(0, 2).toUpperCase();
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true);

    // TODO: Implement API call to /api/auth/logout
    // This will be implemented in the backend phase
    console.log('Logout initiated');

    // Simulate API call
    setTimeout(() => {
      // Clear any stored tokens
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      sessionStorage.removeItem('sb-access-token');
      sessionStorage.removeItem('sb-refresh-token');

      // Redirect to login
      window.location.href = '/auth/login';
    }, 500);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg hover:bg-accent transition-colors p-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu użytkownika"
      >
        <Avatar>
          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
        </Avatar>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium">{user.email}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-popover border border-border z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {user.id.substring(0, 8)}...</p>
            </div>

            {/* Menu items - Disabled for future functionality */}
            <button
              disabled
              className="w-full text-left px-4 py-2 text-sm text-muted-foreground cursor-not-allowed flex items-center gap-2"
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Mój profil
              <span className="ml-auto text-xs">(wkrótce)</span>
            </button>

            <button
              disabled
              className="w-full text-left px-4 py-2 text-sm text-muted-foreground cursor-not-allowed flex items-center gap-2"
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m-9-9h6m6 0h6M7.05 7.05l4.95 4.95m0 0l4.95 4.95m-4.95-4.95l4.95-4.95m-4.95 4.95L7.05 16.95" />
              </svg>
              Ustawienia
              <span className="ml-auto text-xs">(wkrótce)</span>
            </button>

            <div className="border-t border-border my-1" />

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 disabled:opacity-50"
              role="menuitem"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Wyloguj się
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

