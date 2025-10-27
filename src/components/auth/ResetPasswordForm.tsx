// src/components/auth/ResetPasswordForm.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorNotification } from '@/components/ErrorNotification';
import { cn } from '@/lib/utils';

interface ResetPasswordFormProps {
  token: string;
}

interface ResetPasswordFormState {
  newPassword: string;
  confirmNewPassword: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, setState] = React.useState<ResetPasswordFormState>({
    newPassword: '',
    confirmNewPassword: '',
    isLoading: false,
    error: null,
    success: false,
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (password.length === 0) {
      return { score: 0, feedback: '', color: 'bg-gray-200' };
    }

    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push('min. 8 znaków');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('wielka litera');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('cyfra');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('znak specjalny');

    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const feedbackText = feedback.length > 0 ? `Brakuje: ${feedback.join(', ')}` : 'Silne hasło!';

    return {
      score,
      feedback: feedbackText,
      color: colors[score],
    };
  };

  const passwordStrength = calculatePasswordStrength(state.newPassword);

  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const isFormValid =
    validatePassword(state.newPassword) && state.newPassword === state.confirmNewPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(state.newPassword)) {
      setState(prev => ({
        ...prev,
        error: 'Hasło musi mieć co najmniej 8 znaków, zawierać wielką literę, cyfrę i znak specjalny',
      }));
      return;
    }

    if (state.newPassword !== state.confirmNewPassword) {
      setState(prev => ({ ...prev, error: 'Hasła nie są identyczne' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // TODO: Implement API call to /api/auth/reset-password
    // This will be implemented in the backend phase
    console.log('Reset password form submitted:', {
      token,
      newPassword: '***',
    });

    // Simulate API call
    setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false, success: true }));
    }, 1000);
  };

  // Success state
  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-center">Hasło zostało zmienione</CardTitle>
            <CardDescription className="text-center">
              Twoje hasło zostało pomyślnie zmienione. Możesz teraz zalogować się używając nowego
              hasła.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/auth/login">Przejdź do logowania</a>
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
            <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
            <CardDescription>
              Wprowadź nowe hasło dla swojego konta
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {state.error && (
              <ErrorNotification message={state.error} title="Błąd" />
            )}

            {/* New password input */}
            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Nowe hasło
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={state.newPassword}
                  onChange={(e) => setState(prev => ({ ...prev, newPassword: e.target.value }))}
                  disabled={state.isLoading}
                  aria-invalid={state.error ? 'true' : 'false'}
                  aria-describedby="password-strength"
                  required
                  autoFocus
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

              {/* Password strength indicator */}
              {state.newPassword && (
                <div className="space-y-2" id="password-strength">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-gray-200 dark:bg-gray-700'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {passwordStrength.feedback}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm new password input */}
            <div className="space-y-2">
              <label
                htmlFor="confirmNewPassword"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Potwierdź nowe hasło
              </label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={state.confirmNewPassword}
                  onChange={(e) =>
                    setState(prev => ({ ...prev, confirmNewPassword: e.target.value }))
                  }
                  disabled={state.isLoading}
                  aria-invalid={
                    state.confirmNewPassword && state.newPassword !== state.confirmNewPassword
                      ? 'true'
                      : 'false'
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  disabled={state.isLoading}
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
              {state.confirmNewPassword && state.newPassword !== state.confirmNewPassword && (
                <p className="text-xs text-destructive">Hasła nie są identyczne</p>
              )}
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
                  Zmienianie hasła...
                </>
              ) : (
                'Zmień hasło'
              )}
            </Button>

            <Button asChild variant="ghost" className="w-full">
              <a href="/auth/login">Anuluj</a>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

