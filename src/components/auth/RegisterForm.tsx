// src/components/auth/RegisterForm.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorNotification } from '@/components/ErrorNotification';
import { cn } from '@/lib/utils';

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export default function RegisterForm() {
  const [state, setState] = React.useState<RegisterFormState>({
    email: '',
    password: '',
    confirmPassword: '',
    isLoading: false,
    error: null,
    success: false,
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Client-side validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Hasło musi mieć co najmniej 8 znaków');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Hasło musi zawierać wielką literę');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Hasło musi zawierać cyfrę');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Hasło musi zawierać znak specjalny');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const passwordValidation = validatePassword(state.password);
  const passwordsMatch = state.password === state.confirmPassword && state.confirmPassword.length > 0;
  const isFormValid = 
    validateEmail(state.email) && 
    passwordValidation.valid && 
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setState(prev => ({ ...prev, error: 'Popraw błędy formularza' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Call register API endpoint
      const response = await fetch('/api/auth/register', {
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
          error: data.message || 'Wystąpił błąd podczas rejestracji' 
        }));
        return;
      }

      // Success: check if we got tokens (auto-confirm enabled)
      if (data.accessToken) {
        // Auto-login: store tokens and redirect
        localStorage.setItem('sb-access-token', data.accessToken);
        localStorage.setItem('sb-refresh-token', data.refreshToken);
        
        window.location.href = '/generate';
      } else {
        // Email verification required
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          success: true 
        }));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Nie udało się połączyć z serwerem. Spróbuj ponownie.' 
      }));
    }
  };

  // Show success message if email verification required
  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">✅ Rejestracja zakończona!</CardTitle>
            <CardDescription className="text-center">
              Sprawdź swoją skrzynkę email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Wysłaliśmy link weryfikacyjny na adres <strong>{state.email}</strong>.
              Kliknij link w wiadomości, aby aktywować swoje konto.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => window.location.href = '/auth/login'}
            >
              Przejdź do logowania
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
            <CardTitle className="text-2xl">Zarejestruj się</CardTitle>
            <CardDescription>
              Utwórz konto, aby korzystać z 10x Cards
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {state.error && (
              <div data-test-id="register-error-notification">
                <ErrorNotification message={state.error} title="Błąd rejestracji" />
              </div>
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
                data-test-id="register-email-input"
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
                  aria-invalid={state.password.length > 0 && !passwordValidation.valid ? 'true' : 'false'}
                  required
                  data-test-id="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  disabled={state.isLoading}
                  data-test-id="register-password-toggle"
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
              
              {/* Password strength indicator */}
              {state.password.length > 0 && (
                <div className="space-y-1">
                  {passwordValidation.errors.map((error, index) => (
                    <p key={index} className="text-xs text-destructive">
                      • {error}
                    </p>
                  ))}
                  {passwordValidation.valid && (
                    <p className="text-xs text-green-600">
                      ✓ Hasło spełnia wymagania
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password input */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Potwierdź hasło
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={state.confirmPassword}
                  onChange={(e) => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={state.isLoading}
                  aria-invalid={state.confirmPassword.length > 0 && !passwordsMatch ? 'true' : 'false'}
                  required
                  data-test-id="register-confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  disabled={state.isLoading}
                  data-test-id="register-confirm-password-toggle"
                >
                  {showConfirmPassword ? (
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
              
              {state.confirmPassword.length > 0 && (
                <p className={cn(
                  "text-xs",
                  passwordsMatch ? "text-green-600" : "text-destructive"
                )}>
                  {passwordsMatch ? '✓ Hasła są identyczne' : '✗ Hasła nie są identyczne'}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || state.isLoading}
              data-test-id="register-submit-button"
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
                  Rejestracja...
                </>
              ) : (
                'Zarejestruj się'
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Masz już konto?{' '}
              <a
                href="/auth/login"
                className="text-primary font-medium hover:underline underline-offset-4"
                data-test-id="register-login-link"
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
