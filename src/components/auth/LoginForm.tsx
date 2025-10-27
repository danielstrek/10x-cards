// src/components/auth/LoginForm.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorNotification } from '@/components/ErrorNotification';
import { cn } from '@/lib/utils';

interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
}

export default function LoginForm() {
  const [state, setState] = React.useState<LoginFormState>({
    email: '',
    password: '',
    isLoading: false,
    error: null,
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = React.useState(false);

  // Client-side validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = validateEmail(state.email) && state.password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setState(prev => ({ ...prev, error: 'Podaj prawidłowy adres email i hasło' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Call login API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: data.message || 'Wystąpił błąd podczas logowania' 
        }));
        return;
      }

      // Success: store tokens in localStorage
      if (state.rememberMe) {
        localStorage.setItem('sb-access-token', data.accessToken);
        localStorage.setItem('sb-refresh-token', data.refreshToken);
      } else {
        sessionStorage.setItem('sb-access-token', data.accessToken);
        sessionStorage.setItem('sb-refresh-token', data.refreshToken);
      }

      // Redirect to generate page
      window.location.href = '/generate';
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Nie udało się połączyć z serwerem. Spróbuj ponownie.' 
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Zaloguj się</CardTitle>
            <CardDescription>
              Wprowadź swoje dane, aby uzyskać dostęp do 10x Cards
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {state.error && (
              <ErrorNotification message={state.error} title="Błąd logowania" />
            )}

            {/* Email input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                value={state.email}
                onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                disabled={state.isLoading}
                aria-invalid={state.error ? 'true' : 'false'}
                aria-describedby={state.error ? 'email-error' : undefined}
                required
              />
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Hasło
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={state.password}
                  onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
                  disabled={state.isLoading}
                  aria-invalid={state.error ? 'true' : 'false'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  disabled={state.isLoading}
                >
                  {showPassword ? (
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
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={state.rememberMe}
                onChange={(e) => setState(prev => ({ ...prev, rememberMe: e.target.checked }))}
                disabled={state.isLoading}
                className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Zapamiętaj mnie
              </label>
            </div>

            {/* Forgot password link */}
            <div className="text-center">
              <a
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline underline-offset-4"
              >
                Zapomniałeś hasła?
              </a>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || state.isLoading}
            >
              {state.isLoading ? (
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
                  Logowanie...
                </>
              ) : (
                'Zaloguj się'
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Nie masz konta?{' '}
              <a
                href="/auth/register"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Zarejestruj się
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

