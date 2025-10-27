# 📚 Przykłady Użycia - Autentykacja

## Dla Przyszłych Implementacji

Ten dokument zawiera gotowe snippety kodu do użycia w kolejnych fazach implementacji.

---

## 1. Ochrona Strony Astro (Protected Route)

### Przykład: `/generate.astro`

```astro
---
import Layout from "../layouts/Layout.astro";
import FlashcardGenerationView from "../components/FlashcardGenerationView";
import UserNav from "../components/auth/UserNav";

// Sprawdź czy użytkownik jest zalogowany
if (!Astro.locals.user) {
  // Przekieruj na login z parametrem redirect
  const redirectUrl = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/auth/login?redirect=${redirectUrl}`);
}

const user = Astro.locals.user;
---

<Layout title="Generuj Fiszki - 10x Cards">
  <UserNav client:load user={user} />
  <FlashcardGenerationView client:load />
</Layout>
```

---

## 2. Pobieranie Tokenu w React Component

### Przykład: Wysyłanie authenticated request

```tsx
// src/components/FlashcardGenerationView.tsx

const handleGenerate = async () => {
  // Pobierz token z storage
  const token = 
    localStorage.getItem('sb-access-token') || 
    sessionStorage.getItem('sb-access-token');

  if (!token) {
    // Brak tokenu → przekieruj na login
    window.location.href = '/auth/login?redirect=/generate';
    return;
  }

  try {
    const response = await fetch('/api/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ sourceText, model }),
    });

    if (response.status === 401) {
      // Token wygasł → przekieruj
      localStorage.removeItem('sb-access-token');
      sessionStorage.removeItem('sb-access-token');
      window.location.href = '/auth/login?error=session_expired&redirect=/generate';
      return;
    }

    // ... reszta logiki
  } catch (error) {
    console.error('Generation error:', error);
  }
};
```

---

## 3. Custom Hook: useAuth

### Przykład implementacji (opcjonalnie)

```tsx
// src/components/hooks/useAuth.ts
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Pobierz token przy montowaniu
    const accessToken = 
      localStorage.getItem('sb-access-token') || 
      sessionStorage.getItem('sb-access-token');
    
    if (accessToken) {
      setToken(accessToken);
      // Dekoduj JWT (opcjonalnie) lub wywołaj /api/auth/me
      fetchUser(accessToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (accessToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      sessionStorage.removeItem('sb-access-token');
      sessionStorage.removeItem('sb-refresh-token');
      
      setUser(null);
      setToken(null);
      
      window.location.href = '/auth/login';
    }
  };

  return {
    user,
    isLoading,
    token,
    logout,
    isAuthenticated: !!user,
  };
}
```

**Użycie w komponencie**:
```tsx
const MyComponent = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

---

## 4. Endpoint: GET /api/auth/me

```typescript
// src/pages/api/auth/me.ts
import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  // Pobierz token z nagłówka lub cookie
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.substring(7); // Remove "Bearer "

  if (!token) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized', 
        message: 'Missing authorization token' 
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      id: user.id,
      email: user.email!,
      createdAt: user.created_at,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

## 5. Endpoint: POST /api/auth/logout

```typescript
// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Sign out w Supabase (invaliduje token)
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Supabase signOut error:', error);
    // Mimo błędu, kontynuuj (usuń cookies)
  }

  // Usuń wszystkie auth cookies
  // IMPORTANT: Użyj tego samego path co przy setAll
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });

  return new Response(null, { status: 204 });
};
```

---

## 6. Komponent: UserNav.tsx

```tsx
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
      const token = 
        localStorage.getItem('sb-access-token') || 
        sessionStorage.getItem('sb-access-token');

      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      // Clear storage
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      sessionStorage.removeItem('sb-access-token');
      sessionStorage.removeItem('sb-refresh-token');

      // Redirect
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Inicjały z email
  const initials = user.email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <div className="flex items-center gap-3 flex-1">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.email}</span>
          <span className="text-xs text-muted-foreground">
            Zalogowany
          </span>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
      </Button>
    </div>
  );
}
```

---

## 7. Sprawdzanie Tokenu w Istniejących API Routes

### Przykład pattern (już używany w projekcie)

```typescript
// src/pages/api/generations.ts
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Pobierz token z nagłówka
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized', 
        message: 'Missing authorization header' 
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const token = authHeader.substring(7);
  
  // 2. Zweryfikuj token przez Supabase
  const { data: { user }, error: authError } = 
    await locals.supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const userId = user.id;
  
  // 3. Kontynuuj logikę z userId
  // ...
};
```

---

## 8. Redirect z Parametrem (Po Loginie)

### W login.astro:

```astro
---
// Pobierz redirect param z URL
const redirectTo = Astro.url.searchParams.get('redirect') || '/generate';

// Jeśli już zalogowany, przekieruj tam gdzie chciał iść user
if (Astro.locals.user) {
  return Astro.redirect(redirectTo);
}
---
```

### W LoginForm.tsx:

```tsx
// Po sukcesie logowania
const urlParams = new URLSearchParams(window.location.search);
const redirectTo = urlParams.get('redirect') || '/generate';

window.location.href = redirectTo;
```

---

## 9. ErrorNotification - Przykład Użycia

```tsx
// W dowolnym komponencie formularza
import { ErrorNotification } from '@/components/ErrorNotification';

const [error, setError] = useState<string | null>(null);

// W render:
{error && (
  <ErrorNotification 
    message={error} 
    title="Błąd" 
  />
)}

// Ustawianie błędu:
setError('Coś poszło nie tak');

// Czyszczenie błędu:
setError(null);
```

---

## 10. Walidacja Zod - Reużywalny Pattern

```typescript
// src/pages/api/auth/register.ts
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const POST: APIRoute = async ({ request }) => {
  // Parse body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate
  const validationResult = registerSchema.safeParse(requestBody);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Validation failed',
        details: validationResult.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { email, password } = validationResult.data;
  
  // Continue with validated data...
};
```

---

## 11. Conditional Rendering Based on Auth

```astro
---
// src/pages/index.astro
const user = Astro.locals.user;
---

<Layout title="10x Cards">
  {user ? (
    <!-- Zalogowany użytkownik -->
    <div>
      <h1>Witaj, {user.email}!</h1>
      <a href="/generate">Generuj fiszki</a>
    </div>
  ) : (
    <!-- Niezalogowany -->
    <div>
      <h1>Witaj w 10x Cards</h1>
      <a href="/auth/login">Zaloguj się</a>
      <a href="/auth/register">Zarejestruj się</a>
    </div>
  )}
</Layout>
```

---

## 12. Fetch Helper z Auto-Retry

```typescript
// src/lib/fetch-with-auth.ts
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = 
    localStorage.getItem('sb-access-token') || 
    sessionStorage.getItem('sb-access-token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Auto-redirect na login jeśli 401
  if (response.status === 401) {
    localStorage.removeItem('sb-access-token');
    sessionStorage.removeItem('sb-access-token');
    window.location.href = '/auth/login?error=session_expired';
    throw new Error('Authentication expired');
  }

  return response;
}

// Użycie:
const response = await fetchWithAuth('/api/generations', {
  method: 'POST',
  body: JSON.stringify({ sourceText, model }),
});
```

---

## 13. Testing Helpers (Postman/curl)

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'
```

### Get User Info:
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Logout:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Koniec przykładów**

Te snippety można bezpośrednio kopiować i dostosowywać do swoich potrzeb w kolejnych fazach implementacji.

