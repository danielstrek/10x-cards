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

  // Client-side validation
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

    try {
      // Call forgot-password API endpoint
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: data.message || 'Wystąpił błąd podczas wysyłania emaila' 
        }));
        return;
      }

      // Success: show confirmation message
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        emailSent: true 
      }));
    } catch (error) {
      console.error('Forgot password error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Nie udało się połączyć z serwerem. Spróbuj ponownie.' 
      }));
    }
  };

  // Show success message after email sent
  if (state.emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">📧 Email wysłany!</CardTitle>
            <CardDescription className="text-center">
              Sprawdź swoją skrzynkę pocztową
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Jeśli konto z adresem <strong>{state.email}</strong> istnieje,
                wysłaliśmy link do resetowania hasła.
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Link jest ważny przez 60 minut. Sprawdź również folder spam.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => window.location.href = '/auth/login'}
            >
              Powrót do logowania
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setState({
                email: '',
                isLoading: false,
                error: null,
                emailSent: false,
              })}
            >
              Wyślij ponownie
            </Button>
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
              Podaj swój adres email, a wyślemy Ci link do resetowania hasła
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
                Adres email
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
              <p className="text-xs text-muted-foreground">
                Wprowadź email użyty przy rejestracji
              </p>
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

            <div className="text-sm text-center text-muted-foreground">
              Pamiętasz hasło?{' '}
              <a
                href="/auth/login"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Zaloguj się
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
