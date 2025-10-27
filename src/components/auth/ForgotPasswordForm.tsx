// src/components/auth/ForgotPasswordForm.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorNotification } from '@/components/ErrorNotification';

interface ForgotPasswordFormState {
  email: string;
  isLoading: boolean;
  error: string | null;
  emailSent: boolean;
}

export default function ForgotPasswordForm() {
  const [state, setState] = React.useState<ForgotPasswordFormState>({
    email: '',
    isLoading: false,
    error: null,
    emailSent: false,
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = validateEmail(state.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setState(prev => ({ ...prev, error: 'Podaj prawidłowy adres email' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // TODO: Implement API call to /api/auth/forgot-password
    // This will be implemented in the backend phase
    console.log('Forgot password form submitted:', {
      email: state.email,
    });

    // Simulate API call
    setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false, emailSent: true }));
    }, 1000);
  };

  // Success state
  if (state.emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl text-center">Sprawdź swoją skrzynkę</CardTitle>
            <CardDescription className="text-center">
              Jeśli podany adres email istnieje w naszym systemie, wysłaliśmy na niego link do
              resetowania hasła. Sprawdź swoją skrzynkę odbiorczą oraz folder ze spamem.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild variant="outline" className="w-full">
              <a href="/auth/login">Powrót do logowania</a>
            </Button>
            <button
              onClick={() =>
                setState({ email: '', isLoading: false, error: null, emailSent: false })
              }
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Wyślij ponownie
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Resetuj hasło</CardTitle>
            <CardDescription>
              Wprowadź swój adres email, a my wyślemy Ci link do resetowania hasła
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {state.error && (
              <ErrorNotification message={state.error} title="Błąd" />
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
                required
                autoFocus
              />
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
                  Wysyłanie...
                </>
              ) : (
                'Wyślij link resetujący'
              )}
            </Button>

            <Button asChild variant="ghost" className="w-full">
              <a href="/auth/login">Powrót do logowania</a>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

