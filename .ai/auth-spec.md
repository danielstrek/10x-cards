# Specyfikacja Techniczna: System Autentykacji dla 10x-cards

## ZAKRES DOKUMENTU

Ta specyfikacja opisuje **System Autentykacji** dla aplikacji 10x-cards. Jest to **część 1** implementacji pełnego PRD.

### Pokrycie User Stories z PRD

**W pełni pokryte przez tę specyfikację:**
- ✅ **US-001**: Rejestracja konta
- ✅ **US-002**: Logowanie do aplikacji
- ✅ **US-009**: Bezpieczny dostęp i autoryzacja

**Częściowo pokryte:**
- 🟡 **US-003**: Generowanie fiszek przy użyciu AI (dodanie tokenu autoryzacji do istniejących API)
- 🟡 **PRD punkt 3, 7**: Usuwanie konta (endpoint DELETE /api/auth/account - wymagane przez RODO)

**Poza zakresem tej specyfikacji** (wymagają osobnych specyfikacji):
- ⏳ **US-004**: Przegląd i zatwierdzanie propozycji fiszek (już zaimplementowane, wymaga tylko integracji z auth)
- ⏳ **US-005**: Edycja fiszek - wymaga widoku "Moje fiszki"
- ⏳ **US-006**: Usuwanie fiszek - wymaga widoku "Moje fiszki"
- ⏳ **US-007**: Ręczne tworzenie fiszek - wymaga widoku "Moje fiszki"
- ⏳ **US-008**: Sesja nauki z algorytmem powtórek - wymaga osobnej specyfikacji
- ⏳ **PRD punkt 6**: Statystyki generowania fiszek - wymaga osobnej specyfikacji

### Wymagania RODO

**WAŻNE**: Zgodnie z PRD (punkt 3, 7) i wymaganiami RODO, system MUSI umożliwiać:
1. ✅ Rejestrację i przechowywanie danych w bezpieczny sposób (pokryte)
2. ✅ Dostęp do własnych danych (pokryte przez API endpoints)
3. ✅ **Usunięcie konta i wszystkich powiązanych danych** (endpoint DELETE /api/auth/account)

---

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Struktura Stron i Komponentów

#### 1.1.1 Nowe Strony Astro (SSR)

**`src/pages/auth/login.astro`**
- **Opis**: Strona logowania użytkownika
- **Tryb renderowania**: Server-side (output: "server" w astro.config.mjs)
- **Odpowiedzialność**:
  - Sprawdzenie czy użytkownik jest już zalogowany (przez sprawdzenie sesji w cookies)
  - Jeśli zalogowany → przekierowanie na `/generate`
  - Jeśli niezalogowany → wyświetlenie komponentu LoginForm
  - Obsługa query params (np. `?redirect=/generate`, `?error=invalid_credentials`)
- **Layout**: `Layout.astro` z tytułem "Zaloguj się - 10x Cards"
- **Zawartość**: Komponent React `<LoginForm client:load />`

**`src/pages/auth/register.astro`**
- **Opis**: Strona rejestracji nowego użytkownika
- **Tryb renderowania**: Server-side (output: "server")
- **Odpowiedzialność**:
  - Sprawdzenie czy użytkownik jest już zalogowany
  - Jeśli zalogowany → przekierowanie na `/generate`
  - Jeśli niezalogowany → wyświetlenie komponentu RegisterForm
  - Obsługa query params (np. `?redirect=/generate`, `?error=email_exists`)
- **Layout**: `Layout.astro` z tytułem "Zarejestruj się - 10x Cards"
- **Zawartość**: Komponent React `<RegisterForm client:load />`

**`src/pages/auth/forgot-password.astro`**
- **Opis**: Strona resetowania hasła
- **Tryb renderowania**: Server-side (output: "server")
- **Odpowiedzialność**:
  - Wyświetlenie formularza do wysłania emaila z linkiem resetującym
  - Obsługa query params (np. `?success=email_sent`)
- **Layout**: `Layout.astro` z tytułem "Resetuj hasło - 10x Cards"
- **Zawartość**: Komponent React `<ForgotPasswordForm client:load />`

**`src/pages/auth/reset-password.astro`**
- **Opis**: Strona ustawiania nowego hasła
- **Tryb renderowania**: Server-side (output: "server")
- **Odpowiedzialność**:
  - Walidacja tokenu resetowania z query params
  - Jeśli token nieprawidłowy → przekierowanie na `/auth/forgot-password?error=invalid_token`
  - Wyświetlenie formularza do ustawienia nowego hasła
- **Layout**: `Layout.astro` z tytułem "Ustaw nowe hasło - 10x Cards"
- **Zawartość**: Komponent React `<ResetPasswordForm client:load />`

**`src/pages/auth/verify-email.astro`**
- **Opis**: Strona potwierdzenia emaila (opcjonalne w MVP)
- **Tryb renderowania**: Server-side (output: "server")
- **Odpowiedzialność**:
  - Automatyczna weryfikacja tokenu z URL
  - Wyświetlenie komunikatu o sukcesie/błędzie
  - Przekierowanie na `/auth/login` po 3 sekundach w przypadku sukcesu
- **Layout**: `Layout.astro` z tytułem "Weryfikacja emaila - 10x Cards"

#### 1.1.2 Zmodyfikowane Strony Astro

**`src/pages/index.astro`** (strona powitalna)
- **Obecny stan**: Wyświetla komponent Welcome bez autentykacji
- **Wymagane zmiany**:
  - Sprawdzenie sesji użytkownika w kodzie server-side
  - Jeśli użytkownik zalogowany → przekierowanie na `/generate`
  - Jeśli niezalogowany → wyświetlenie strony powitalnej z przyciskami "Zaloguj się" i "Zarejestruj się"
- **Nowe elementy UI**:
  - Przycisk "Zaloguj się" → link do `/auth/login`
  - Przycisk "Zarejestruj się" → link do `/auth/register`

**`src/pages/generate.astro`** (główna funkcjonalność generowania fiszek)
- **Obecny stan**: Dostępna bez autentykacji
- **Wymagane zmiany**:
  - **Middleware Protection**: Sprawdzenie sesji przed renderowaniem
  - Jeśli niezalogowany → przekierowanie na `/auth/login?redirect=/generate`
  - Jeśli zalogowany → renderowanie komponentu FlashcardGenerationView
  - Dodanie nagłówka z informacją o użytkowniku i przyciskiem wylogowania
- **Nowy komponent**: `<UserNav client:load />` w górnej części strony

#### 1.1.3 Nowe Komponenty React (Client-side)

**`src/components/auth/LoginForm.tsx`**
- **Typ**: Interaktywny komponent React
- **Odpowiedzialność**:
  - Zarządzanie stanem formularza (email, password)
  - Walidacja po stronie klienta (format email, minimalna długość hasła)
  - Obsługa submit formularza
  - Wysyłanie żądania POST do `/api/auth/login`
  - Przechowywanie tokenu w localStorage/sessionStorage
  - Przekierowanie na stronę docelową po sukcesie
  - Wyświetlanie błędów (nieprawidłowe dane, błąd serwera)
- **Stan komponentu**:
  ```typescript
  {
    email: string;
    password: string;
    isLoading: boolean;
    error: string | null;
    rememberMe: boolean;
  }
  ```
- **Elementy UI**:
  - Input email (z walidacją)
  - Input password (z możliwością pokazania/ukrycia hasła)
  - Checkbox "Zapamiętaj mnie"
  - Przycisk "Zaloguj się" (z loaderem podczas wysyłania)
  - Link "Zapomniałeś hasła?" → `/auth/forgot-password`
  - Link "Nie masz konta? Zarejestruj się" → `/auth/register`
  - Komponent `<ErrorNotification />` do wyświetlania błędów

**`src/components/auth/RegisterForm.tsx`**
- **Typ**: Interaktywny komponent React
- **Odpowiedzialność**:
  - Zarządzanie stanem formularza (email, password, confirmPassword)
  - Walidacja po stronie klienta:
    - Format email
    - Siła hasła (min. 8 znaków, wielka litera, cyfra, znak specjalny)
    - Zgodność hasła i potwierdzenia hasła
  - Wysyłanie żądania POST do `/api/auth/register`
  - Wyświetlanie sukcesu i instrukcji dalszych kroków
  - Obsługa błędów (email już istnieje, słabe hasło)
- **Stan komponentu**:
  ```typescript
  {
    email: string;
    password: string;
    confirmPassword: string;
    isLoading: boolean;
    error: string | null;
    success: boolean;
  }
  ```
- **Elementy UI**:
  - Input email
  - Input password (z wskaźnikiem siły hasła)
  - Input confirm password
  - Checkbox akceptacji regulaminu (opcjonalnie)
  - Przycisk "Zarejestruj się"
  - Link "Masz już konto? Zaloguj się" → `/auth/login`
  - Komponent sukcesu z instrukcją sprawdzenia emaila (jeśli wymagana weryfikacja)

**`src/components/auth/ForgotPasswordForm.tsx`**
- **Typ**: Interaktywny komponent React
- **Odpowiedzialność**:
  - Zarządzanie stanem formularza (email)
  - Walidacja email
  - Wysyłanie żądania POST do `/api/auth/forgot-password`
  - Wyświetlanie komunikatu o wysłaniu emaila
- **Stan komponentu**:
  ```typescript
  {
    email: string;
    isLoading: boolean;
    error: string | null;
    emailSent: boolean;
  }
  ```
- **Elementy UI**:
  - Input email
  - Przycisk "Wyślij link resetujący"
  - Komunikat sukcesu po wysłaniu
  - Link powrotny do logowania

**`src/components/auth/ResetPasswordForm.tsx`**
- **Typ**: Interaktywny komponent React
- **Props**: `token: string` (z query params)
- **Odpowiedzialność**:
  - Zarządzanie stanem formularza (newPassword, confirmNewPassword)
  - Walidacja siły hasła
  - Wysyłanie żądania POST do `/api/auth/reset-password`
  - Przekierowanie na stronę logowania po sukcesie
- **Stan komponentu**:
  ```typescript
  {
    newPassword: string;
    confirmNewPassword: string;
    isLoading: boolean;
    error: string | null;
    success: boolean;
  }
  ```

**`src/components/auth/UserNav.tsx`**
- **Typ**: Interaktywny komponent React
- **Odpowiedzialność**:
  - Wyświetlanie informacji o zalogowanym użytkowniku (email, avatar)
  - Menu dropdown z opcjami:
    - "Mój profil" (przyszła funkcjonalność)
    - "Ustawienia" (przyszła funkcjonalność)
    - "Wyloguj się"
  - Obsługa wylogowania (wywołanie POST `/api/auth/logout`, usunięcie tokenu, przekierowanie)
- **Stan komponentu**:
  ```typescript
  {
    user: { email: string; id: string } | null;
    isOpen: boolean;
    isLoading: boolean;
  }
  ```
- **Elementy UI** (używając Shadcn/ui):
  - Avatar z inicjałami użytkownika
  - Dropdown menu
  - Loading state podczas wylogowywania

#### 1.1.4 Rozszerzenie Istniejących Komponentów

**`src/components/FlashcardGenerationView.tsx`**
- **Obecny stan**: Wysyła żądania do API bez tokenu
- **Wymagane zmiany**:
  - Pobranie tokenu z localStorage/sessionStorage
  - Dodanie tokenu do nagłówka Authorization we wszystkich żądaniach API
  - Obsługa błędu 401 (wygasła sesja) → przekierowanie na `/auth/login`
  - Wyświetlanie komunikatu o konieczności ponownego zalogowania

**`src/layouts/Layout.astro`**
- **Obecny stan**: Podstawowy layout HTML
- **Wymagane zmiany**:
  - Opcjonalne: Dodanie warunkowego renderowania nawigacji w zależności od stanu autentykacji
  - Możliwość przekazania props `showNav` do wyświetlenia komponentu UserNav

### 1.2 Walidacja i Komunikaty Błędów

#### 1.2.1 Walidacja Client-side (React)

**Email**:
- Format: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Komunikat błędu: "Podaj prawidłowy adres email"

**Hasło (rejestracja i reset)**:
- Minimalna długość: 8 znaków
- Wymogi: co najmniej 1 wielka litera, 1 cyfra, 1 znak specjalny
- Komunikaty:
  - "Hasło musi mieć co najmniej 8 znaków"
  - "Hasło musi zawierać wielką literę, cyfrę i znak specjalny"

**Potwierdzenie hasła**:
- Warunek: musi być identyczne z hasłem
- Komunikat: "Hasła nie są identyczne"

#### 1.2.2 Komunikaty Błędów z API

**401 Unauthorized**:
- UI: "Nieprawidłowy email lub hasło"
- Akcja: Wyświetlenie błędu w formularzu

**409 Conflict** (email już istnieje):
- UI: "Konto z tym adresem email już istnieje"
- Akcja: Podświetlenie pola email, link do strony logowania

**400 Bad Request** (walidacja):
- UI: Wyświetlenie szczegółowych błędów walidacji przy odpowiednich polach
- Format: `{ field: 'email', message: 'Invalid email format' }`

**429 Too Many Requests**:
- UI: "Zbyt wiele prób. Spróbuj ponownie za chwilę"
- Akcja: Wyłączenie przycisku submit na 60 sekund

**500 Internal Server Error**:
- UI: "Wystąpił błąd serwera. Spróbuj ponownie później"
- Akcja: Wyświetlenie generycznego komunikatu, logowanie po stronie klienta

### 1.3 Obsługa Scenariuszy

#### 1.3.1 Scenariusz: Rejestracja Nowego Użytkownika

1. Użytkownik wchodzi na `/` → widzi stronę powitalną
2. Kliknięcie "Zarejestruj się" → przekierowanie na `/auth/register`
3. Wypełnienie formularza (email, hasło, potwierdzenie hasła)
4. Walidacja client-side → wyświetlenie błędów jeśli są
5. Submit → POST `/api/auth/register`
6. **Opcja A** (bez weryfikacji email - preferowana dla MVP):
   - Sukces → automatyczne logowanie → token zapisany w storage
   - Przekierowanie na `/generate`
7. **Opcja B** (z weryfikacją email):
   - Sukces → wyświetlenie komunikatu "Sprawdź swoją skrzynkę email"
   - Email z linkiem weryfikacyjnym
   - Po kliknięciu → `/auth/verify-email?token=...`
   - Przekierowanie na `/auth/login` po weryfikacji

#### 1.3.2 Scenariusz: Logowanie

1. Użytkownik na `/` → kliknięcie "Zaloguj się"
2. Przekierowanie na `/auth/login`
3. Wypełnienie formularza (email, hasło)
4. Submit → POST `/api/auth/login`
5. Sukces:
   - Otrzymanie tokenu JWT
   - Zapisanie w localStorage (lub sessionStorage jeśli unchecked "Zapamiętaj")
   - Przekierowanie na `/generate` (lub URL z parametru `redirect`)
6. Błąd:
   - Wyświetlenie komunikatu błędu
   - Możliwość ponownej próby

#### 1.3.3 Scenariusz: Zapomniałem Hasła

1. Na stronie `/auth/login` → kliknięcie "Zapomniałeś hasła?"
2. Przekierowanie na `/auth/forgot-password`
3. Wpisanie email → submit → POST `/api/auth/forgot-password`
4. Sukces:
   - Komunikat "Link resetujący został wysłany na podany email"
   - Email z linkiem: `/auth/reset-password?token=...`
5. Kliknięcie linku z emaila → otwarcie strony reset hasła
6. Wpisanie nowego hasła → submit → POST `/api/auth/reset-password`
7. Sukces → przekierowanie na `/auth/login` z komunikatem "Hasło zostało zmienione"

#### 1.3.4 Scenariusz: Dostęp do Chronionej Strony (Niezalogowany)

1. Użytkownik próbuje wejść bezpośrednio na `/generate`
2. Middleware sprawdza sesję → brak tokenu lub nieważny token
3. Przekierowanie na `/auth/login?redirect=/generate`
4. Po zalogowaniu → przekierowanie z powrotem na `/generate`

#### 1.3.5 Scenariusz: Wygasła Sesja

1. Użytkownik zalogowany, korzysta z aplikacji
2. Token JWT wygasa (np. po 1 godzinie)
3. Próba wywołania API → 401 Unauthorized
4. Przechwycenie błędu w komponencie/hook
5. Usunięcie tokenu z storage
6. Przekierowanie na `/auth/login?error=session_expired&redirect=/generate`
7. Wyświetlenie komunikatu: "Twoja sesja wygasła. Zaloguj się ponownie"

#### 1.3.6 Scenariusz: Wylogowanie

1. Użytkownik kliknął przycisk wylogowania w UserNav
2. Wywołanie POST `/api/auth/logout` (invalidacja tokenu w Supabase)
3. Usunięcie tokenu z localStorage
4. Przekierowanie na `/` lub `/auth/login`

---

## 2. LOGIKA BACKENDOWA

### 2.1 Struktura Endpointów API

#### 2.1.1 POST /api/auth/register

**Lokalizacja**: `src/pages/api/auth/register.ts`

**Odpowiedzialność**:
- Walidacja danych wejściowych (email, password)
- Rejestracja użytkownika w Supabase Auth
- Zwrócenie informacji o utworzonym koncie

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Walidacja (Zod schema)**:
```typescript
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
```

**Logika endpointu**:
1. Parsowanie i walidacja request body
2. Wywołanie `supabaseClient.auth.signUp({ email, password })`
3. Obsługa różnych przypadków:
   - Sukces → 201 Created z danymi użytkownika
   - Email już istnieje → 409 Conflict
   - Błąd Supabase → 500 Internal Server Error
4. **Opcjonalnie**: Wysłanie emaila weryfikacyjnego (jeśli włączone w Supabase)

**Response (201 Created)**:
```typescript
{
  userId: string;
  email: string;
  createdAt: string;
}
```

**Response (409 Conflict)**:
```typescript
{
  error: 'Conflict';
  message: 'Email already registered';
}
```

**Response (400 Bad Request)**:
```typescript
{
  error: 'Bad Request';
  message: 'Validation failed';
  details: Array<{ path: string; message: string }>;
}
```

#### 2.1.2 POST /api/auth/login

**Lokalizacja**: `src/pages/api/auth/login.ts`

**Odpowiedzialność**:
- Walidacja danych wejściowych
- Autentykacja użytkownika
- Zwrócenie tokenu JWT

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Walidacja (Zod schema)**:
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
```

**Logika endpointu**:
1. Parsowanie i walidacja request body
2. Wywołanie `supabaseClient.auth.signInWithPassword({ email, password })`
3. Obsługa przypadków:
   - Sukces → 200 OK z tokenem JWT
   - Nieprawidłowe dane → 401 Unauthorized
   - Konto niezweryfikowane → 401 Unauthorized z odpowiednim komunikatem
   - Błąd serwera → 500 Internal Server Error

**Response (200 OK)**:
```typescript
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // sekundy
  user: {
    id: string;
    email: string;
  }
}
```

**Response (401 Unauthorized)**:
```typescript
{
  error: 'Unauthorized';
  message: 'Invalid email or password';
}
```

#### 2.1.3 POST /api/auth/logout

**Lokalizacja**: `src/pages/api/auth/logout.ts`

**Odpowiedzialność**:
- Invalidacja tokenu użytkownika
- Wylogowanie z Supabase Auth

**Authorization**: Bearer token (wymagany)

**Logika endpointu**:
1. Sprawdzenie nagłówka Authorization
2. Wywołanie `supabaseClient.auth.signOut()`
3. Zwrócenie 204 No Content

**Response (204 No Content)**: brak body

**Response (401 Unauthorized)**:
```typescript
{
  error: 'Unauthorized';
  message: 'Missing or invalid authorization token';
}
```

#### 2.1.4 POST /api/auth/forgot-password

**Lokalizacja**: `src/pages/api/auth/forgot-password.ts`

**Odpowiedzialność**:
- Wysłanie emaila z linkiem resetującym hasło
- Wykorzystanie Supabase Auth do generowania tokenu

**Request Body**:
```typescript
{
  email: string;
}
```

**Walidacja (Zod schema)**:
```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});
```

**Logika endpointu**:
1. Walidacja email
2. Wywołanie `supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: '...' })`
3. Zawsze zwrócenie sukcesu (security best practice - nie ujawniamy czy email istnieje)

**Response (200 OK)**:
```typescript
{
  message: 'If the email exists, a password reset link has been sent';
}
```

#### 2.1.5 POST /api/auth/reset-password

**Lokalizacja**: `src/pages/api/auth/reset-password.ts`

**Odpowiedzialność**:
- Ustawienie nowego hasła
- Walidacja tokenu resetowania

**Request Body**:
```typescript
{
  token: string;
  newPassword: string;
}
```

**Walidacja**:
```typescript
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
```

**Logika endpointu**:
1. Walidacja danych wejściowych
2. Wywołanie `supabaseClient.auth.updateUser({ password: newPassword })`
3. Obsługa przypadków:
   - Sukces → 200 OK
   - Nieprawidłowy/wygasły token → 400 Bad Request
   - Błąd serwera → 500 Internal Server Error

**Response (200 OK)**:
```typescript
{
  message: 'Password has been reset successfully';
}
```

**Response (400 Bad Request)**:
```typescript
{
  error: 'Bad Request';
  message: 'Invalid or expired reset token';
}
```

#### 2.1.6 GET /api/auth/me

**Lokalizacja**: `src/pages/api/auth/me.ts`

**Odpowiedzialność**:
- Zwrócenie informacji o aktualnie zalogowanym użytkowniku
- Weryfikacja tokenu

**Authorization**: Bearer token (wymagany)

**Logika endpointu**:
1. Sprawdzenie nagłówka Authorization
2. Wywołanie `supabaseClient.auth.getUser(token)`
3. Zwrócenie danych użytkownika lub błędu

**Response (200 OK)**:
```typescript
{
  id: string;
  email: string;
  createdAt: string;
}
```

**Response (401 Unauthorized)**:
```typescript
{
  error: 'Unauthorized';
  message: 'Invalid or expired token';
}
```

#### 2.1.7 DELETE /api/auth/account

**Lokalizacja**: `src/pages/api/auth/account.ts`

**Odpowiedzialność**:
- Usunięcie konta użytkownika i wszystkich powiązanych danych
- Wymagane przez RODO (PRD punkt 3, 7)

**Authorization**: Bearer token (wymagany)

**Logika endpointu**:
1. Sprawdzenie nagłówka Authorization i weryfikacja użytkownika
2. Usunięcie wszystkich fiszek użytkownika (CASCADE z user_id)
3. Usunięcie historii generowania (generations, generation_error_logs)
4. Usunięcie konta użytkownika z Supabase Auth
5. Zwrócenie 204 No Content

**Response (204 No Content)**: brak body

**Response (401 Unauthorized)**:
```typescript
{
  error: 'Unauthorized';
  message: 'Invalid or expired token';
}
```

**Response (500 Internal Server Error)**:
```typescript
{
  error: 'Internal Server Error';
  message: 'Failed to delete account';
}
```

**UWAGA**: Ten endpoint jest **WYMAGANY przez RODO** i musi być zaimplementowany w MVP zgodnie z PRD.

### 2.2 Walidacja Danych Wejściowych

**Podejście**: Wykorzystanie biblioteki Zod do definiowania schematów walidacji

**Lokalizacja schematów**: W każdym pliku endpointu (kolokacja z logiką)

**Wspólne reguły walidacji**:
- Email: format zgodny z RFC 5322
- Hasło: min. 8 znaków, 1 wielka litera, 1 cyfra, 1 znak specjalny
- Token: string niepusty

**Przykład użycia w endpoincie**:
```typescript
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
```

### 2.3 Obsługa Wyjątków

**Strategia**: Early returns dla przypadków błędnych, happy path na końcu funkcji

**Hierarchia obsługi błędów**:

1. **Błędy walidacji** (400 Bad Request)
   - Nieprawidłowy format danych
   - Brakujące wymagane pola
   - Zwracane z szczegółami walidacji

2. **Błędy autentykacji** (401 Unauthorized)
   - Brak tokenu
   - Nieprawidłowy token
   - Wygasły token
   - Nieprawidłowe dane logowania

3. **Błędy autoryzacji** (403 Forbidden)
   - Próba dostępu do zasobów innego użytkownika
   - (Używane w istniejących endpointach flashcards/generations)

4. **Błędy zasobów** (404 Not Found)
   - Użytkownik nie istnieje (w niektórych przypadkach)

5. **Błędy konfliktów** (409 Conflict)
   - Email już zarejestrowany

6. **Błędy rate limiting** (429 Too Many Requests)
   - Zbyt wiele prób logowania
   - (Do implementacji w przyszłości)

7. **Błędy serwera** (500 Internal Server Error)
   - Błędy połączenia z Supabase
   - Nieoczekiwane wyjątki
   - Logowanie na konsolę serwera

**Przykład struktury obsługi błędów**:
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Walidacja JSON
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Walidacja schematu
    const validationResult = schema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Validation failed', details: [...] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Logika biznesowa
    const { data, error } = await supabaseClient.auth.signUp(...);
    
    if (error) {
      // Obsługa specyficznych błędów Supabase
      if (error.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'Conflict', message: 'Email already registered' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Generyczne błędy
      console.error('Supabase auth error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: 'Authentication failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Happy path
    return new Response(
      JSON.stringify({ userId: data.user.id, ... }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    // Catch-all dla nieoczekiwanych błędów
    console.error('Unexpected error in auth endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 2.4 Aktualizacja Renderowania Server-Side

**Mechanizm**: Wykorzystanie Astro middleware i cookies do sprawdzania sesji

**Zmiany w `src/middleware/index.ts`**:

**Obecny stan**:
```typescript
export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseServiceClient;
  return next();
});
```

**Nowy stan** (rozszerzony):
```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // Dodaj Supabase client do locals (bez zmian)
  context.locals.supabase = supabaseServiceClient;
  
  // Sprawdź sesję użytkownika z cookies
  const accessToken = context.cookies.get('sb-access-token')?.value;
  
  if (accessToken) {
    // Zweryfikuj token
    const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
    
    if (!error && user) {
      // Dodaj użytkownika do context.locals
      context.locals.user = {
        id: user.id,
        email: user.email!,
      };
    }
  }
  
  return next();
});
```

**Definicja typów w `src/env.d.ts`** (aktualizacja):
```typescript
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}
```

**Ochrona stron przed nieautoryzowanym dostępem**:

Każda chroniona strona Astro (np. `generate.astro`) powinna zawierać:

```typescript
---
import Layout from "../layouts/Layout.astro";
import FlashcardGenerationView from "../components/FlashcardGenerationView";

// Sprawdź czy użytkownik jest zalogowany
if (!Astro.locals.user) {
  // Przekieruj na stronę logowania z parametrem redirect
  const redirectUrl = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/auth/login?redirect=${redirectUrl}`);
}

const user = Astro.locals.user;
---

<Layout title="Generate Flashcards - 10x Cards">
  <UserNav client:load user={user} />
  <FlashcardGenerationView client:load />
</Layout>
```

**Logika przekierowań dla stron auth**:

Strony logowania/rejestracji (np. `login.astro`) powinny przekierowywać zalogowanych użytkowników:

```typescript
---
import Layout from "../../layouts/Layout.astro";
import LoginForm from "../../components/auth/LoginForm";

// Jeśli użytkownik już zalogowany, przekieruj na generate
if (Astro.locals.user) {
  return Astro.redirect('/generate');
}
---

<Layout title="Zaloguj się - 10x Cards">
  <LoginForm client:load />
</Layout>
```

---

## 3. SYSTEM AUTENTYKACJI

### 3.1 Wykorzystanie Supabase Auth

**Konfiguracja Supabase Auth**:
- Lokalizacja ustawień: Supabase Dashboard → Authentication → Settings
- Wymagane konfiguracje:
  - **Site URL**: URL aplikacji produkcyjnej (np. `https://10x-cards.com`)
  - **Redirect URLs**: Lista dozwolonych URLi przekierowań po autentykacji
    - `http://localhost:3000/auth/callback` (development)
    - `https://10x-cards.com/auth/callback` (production)
  - **Email Auth**: Włączone (domyślne)
  - **Email Verification**: Opcjonalne (zalecane wyłączone dla MVP)
  - **JWT expiry**: 3600 sekund (1 godzina) - domyślne

**Supabase Client dla Autentykacji**:

W przeciwieństwie do operacji na danych (gdzie używamy `supabaseServiceClient`), do autentykacji używamy **publicznego klienta** (`supabaseClient` z anon key):

**Lokalizacja**: `src/db/supabase.client.ts` (już istnieje)

**Uzasadnienie**:
- Supabase Auth wymaga użycia anon key (nie service role key)
- Service role key bypasses'uje wszystkie zabezpieczenia RLS, co nie jest potrzebne dla auth
- Anon key pozwala na bezpieczne operacje auth po stronie klienta i serwera

**Eksport dla auth**:
```typescript
// W src/db/supabase.client.ts
export { supabaseClient as supabaseAuthClient };
```

### 3.2 Proces Rejestracji

**Implementacja w `src/pages/api/auth/register.ts`**:

```typescript
import { supabaseClient } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request }) => {
  // ... walidacja ...
  
  const { email, password } = validationResult.data;
  
  // Rejestracja w Supabase Auth
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      // Opcjonalnie: dodatkowe metadane użytkownika
      data: {
        // np. displayName, jeśli będzie wymagane
      }
    }
  });
  
  if (error) {
    // Obsługa błędów (email już istnieje, itp.)
    // ...
  }
  
  // Supabase automatycznie tworzy rekord w tabeli auth.users
  // User ID: data.user.id
  
  return new Response(
    JSON.stringify({
      userId: data.user!.id,
      email: data.user!.email!,
      createdAt: data.user!.created_at,
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
```

**Ważne uwagi**:
- Supabase automatycznie hashuje hasła (bcrypt)
- User ID jest UUID v4 generowane przez Supabase
- Po rejestracji użytkownik może od razu się zalogować (jeśli email verification wyłączona)

### 3.3 Proces Logowania

**Implementacja w `src/pages/api/auth/login.ts`**:

```typescript
import { supabaseClient } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  // ... walidacja ...
  
  const { email, password } = validationResult.data;
  
  // Logowanie w Supabase Auth
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid email or password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Opcjonalnie: Zapisz token w cookie (dla SSR)
  cookies.set('sb-access-token', data.session!.access_token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD, // tylko HTTPS w produkcji
    sameSite: 'lax',
    maxAge: data.session!.expires_in,
  });
  
  cookies.set('sb-refresh-token', data.session!.refresh_token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dni
  });
  
  // Zwróć token również w response body (dla localStorage)
  return new Response(
    JSON.stringify({
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token,
      expiresIn: data.session!.expires_in,
      user: {
        id: data.user!.id,
        email: data.user!.email!,
      }
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

**Strategia przechowywania tokenów**:
- **Cookies (httpOnly)**: Główna metoda dla zabezpieczenia przed XSS, używana przez SSR
- **localStorage**: Backup dla client-side requests (React components)

### 3.4 Proces Wylogowania

**Implementacja w `src/pages/api/auth/logout.ts`**:

```typescript
import { supabaseClient } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Pobierz token z nagłówka lub cookie
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.substring(7) || cookies.get('sb-access-token')?.value;
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'No token provided' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Wylogowanie w Supabase (invalidacja tokenu)
  const { error } = await supabaseClient.auth.signOut();
  
  // Usuń cookies (nawet jeśli signOut zwrócił błąd)
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  
  if (error) {
    console.error('Supabase signOut error:', error);
    // Mimo błędu, zwróć sukces (cookies są już usunięte)
  }
  
  return new Response(null, { status: 204 });
};
```

### 3.5 Odzyskiwanie Hasła

**Proces forgot-password**:

1. Użytkownik wysyła email przez `/api/auth/forgot-password`
2. Supabase generuje token resetowania i wysyła email
3. Email zawiera link: `https://10x-cards.com/auth/reset-password?token=...`
4. Użytkownik klika link → otwarcie strony reset hasła
5. Formularz wysyła nowe hasło + token do `/api/auth/reset-password`

**Implementacja forgot-password**:

```typescript
import { supabaseClient } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request }) => {
  // ... walidacja ...
  
  const { email } = validationResult.data;
  
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/auth/reset-password`,
  });
  
  // Zawsze zwracaj sukces (security best practice)
  return new Response(
    JSON.stringify({ 
      message: 'If the email exists, a password reset link has been sent' 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

**Implementacja reset-password**:

```typescript
export const POST: APIRoute = async ({ request }) => {
  // ... walidacja ...
  
  const { token, newPassword } = validationResult.data;
  
  // Ustawienie sesji z tokenem resetowania
  const { error: sessionError } = await supabaseClient.auth.setSession({
    access_token: token,
    refresh_token: token,
  });
  
  if (sessionError) {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'Invalid or expired token' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Aktualizacja hasła
  const { error: updateError } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });
  
  if (updateError) {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'Failed to reset password' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ message: 'Password has been reset successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

### 3.6 Weryfikacja Tokenu

**Mechanizm weryfikacji w istniejących endpointach**:

Wzorzec już używany w `/api/generations` i `/api/flashcards`:

```typescript
// Przykład z src/pages/api/generations.ts
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Pobierz token z nagłówka
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Missing authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const token = authHeader.substring(7);
  
  // 2. Zweryfikuj token
  const { data: { user }, error: authError } = await locals.supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const userId = user.id;
  
  // 3. Kontynuuj logikę endpointu z userId
  // ...
};
```

**Ten wzorzec pozostaje bez zmian** - jest już zgodny z najlepszymi praktykami.

### 3.7 Refresh Token Mechanism

**Strategia odświeżania tokenów**:

**Client-side (React)**:
- Implementacja custom hook `useAuth` do zarządzania sesją
- Automatyczne odświeżanie tokenu przed wygaśnięciem
- Przechowywanie refresh token w localStorage

**Lokalizacja**: `src/components/hooks/useAuth.ts` (nowy hook)

**Podstawowa struktura**:
```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Funkcja odświeżania tokenu
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('sb-refresh-token');
    if (!refreshToken) return null;
    
    // Wywołanie Supabase do odświeżenia tokenu
    // (można to zrobić przez endpoint lub bezpośrednio z klienta)
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('sb-access-token', data.accessToken);
      return data.accessToken;
    }
    
    return null;
  };
  
  // Automatyczne odświeżanie co 50 minut (przed wygaśnięciem 1h tokenu)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAccessToken();
    }, 50 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { user, isLoading, refreshAccessToken };
}
```

**Endpoint `/api/auth/refresh`** (opcjonalny):
```typescript
export const POST: APIRoute = async ({ request }) => {
  const { refreshToken } = await request.json();
  
  const { data, error } = await supabaseClient.auth.refreshSession({
    refresh_token: refreshToken,
  });
  
  if (error || !data.session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid refresh token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({
      accessToken: data.session.access_token,
      expiresIn: data.session.expires_in,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

### 3.8 Integracja z Istniejącymi Tabelami

**Powiązanie user_id**:

Istniejące tabele już zawierają kolumnę `user_id`:
- `flashcards.user_id` → UUID
- `generations.user_id` → UUID
- `generation_error_logs.user_id` → UUID

**User ID pochodzi z Supabase Auth**:
- Po rejestracji użytkownika, Supabase tworzy rekord w `auth.users`
- Ten sam UUID jest używany w kolumnach `user_id` w tabelach aplikacji
- Nie ma potrzeby tworzenia dodatkowej tabeli `users` w schemacie `public`

**Integracja w serwisach**:

Istniejące serwisy już poprawnie używają `userId`:
```typescript
// src/lib/services/flashcards.service.ts
export async function bulkCreateFlashcards(
  supabase: SupabaseClient,
  dto: BulkCreateFlashcardsDto,
  userId: string // UUID z Supabase Auth
): Promise<FlashcardCreatedDto[]> {
  // ...
  const flashcardsToInsert = dto.flashcards.map((flashcard) => ({
    user_id: userId, // ✅ Powiązanie z użytkownikiem
    // ...
  }));
  // ...
}
```

**Brak konieczności migracji** - tabele są już przygotowane na autentykację.

---

## 4. PODSUMOWANIE I KLUCZOWE DECYZJE ARCHITEKTONICZNE

### 4.1 Kluczowe Komponenty

**Frontend (Astro + React)**:
- 4 nowe strony Astro: login, register, forgot-password, reset-password
- 5 nowych komponentów React: LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, UserNav
- Rozszerzenie istniejących: FlashcardGenerationView (dodanie Authorization header)
- Middleware SSR dla ochrony stron

**Backend (Astro API Routes)**:
- 7 nowych endpointów w tej specyfikacji: register, login, logout, forgot-password, reset-password, me, account (DELETE)
- Endpoint account DELETE jest **WYMAGANY przez RODO** (PRD punkt 3, 7)
- Wszystkie z walidacją Zod
- Wykorzystanie istniejącego wzorca obsługi błędów
- Integracja z Supabase Auth

**Autentykacja**:
- Supabase Auth jako główny system
- JWT tokeny z 1h czasem życia
- Refresh tokens dla długotrwałych sesji
- Cookies (httpOnly) + localStorage dla elastyczności

### 4.2 Bezpieczeństwo

**Ochrona przed atakami**:
- XSS: HttpOnly cookies, sanityzacja inputów
- CSRF: SameSite cookies
- Brute force: Rate limiting (do implementacji)
- SQL Injection: N/A (Supabase ORM)

**Polityka haseł**:
- Min. 8 znaków
- Wymóg wielkich liter, cyfr, znaków specjalnych
- Hashing przez Supabase (bcrypt)

**Zarządzanie tokenami**:
- Krótki czas życia access token (1h)
- Długotrwałe refresh tokens (7 dni)
- Invalidacja przy wylogowaniu

### 4.3 Zgodność z Wymaganiami PRD

#### Mapowanie User Stories na Implementację

**US-001: Rejestracja konta** ✅ W PEŁNI ZAIMPLEMENTOWANE
- ✅ Formularz rejestracyjny (email + hasło) → `RegisterForm.tsx`
- ✅ Walidacja danych → Client-side (React) + Server-side (Zod)
- ✅ Potwierdzenie rejestracji → Success state w komponencie
- ✅ Automatyczne logowanie po rejestracji → Token w localStorage + przekierowanie
- **Implementacja**: `/auth/register` + `/api/auth/register`

**US-002: Logowanie do aplikacji** ✅ W PEŁNI ZAIMPLEMENTOWANE
- ✅ Formularz logowania → `LoginForm.tsx`
- ✅ Przekierowanie na `/generate` po zalogowaniu → `?redirect=` parameter
- ✅ Komunikaty błędów dla nieprawidłowych danych → Error states
- ✅ Bezpieczne przechowywanie danych logowania → JWT + httpOnly cookies
- **Implementacja**: `/auth/login` + `/api/auth/login`

**US-003: Generowanie fiszek przy użyciu AI** 🟡 CZĘŚCIOWO
- ✅ Endpoint już istnieje i ma autoryzację → `/api/generations`
- ✅ Pole tekstowe 1000-10000 znaków → `FlashcardGenerationView.tsx`
- 🟡 **DO ZROBIENIA**: Dodanie tokenu do nagłówka Authorization w requestach
- 🟡 **DO ZROBIENIA**: Obsługa 401 (wygasła sesja) → przekierowanie na login

**US-004: Przegląd i zatwierdzanie propozycji fiszek** ⏳ JUŻ ZAIMPLEMENTOWANE
- ✅ Lista wygenerowanych fiszek → `FlashcardList.tsx`
- ✅ Przyciski zatwierdzenia/edycji/odrzucenia → `FlashcardListItem.tsx`
- ✅ Zapis do bazy → `/api/flashcards` + `BulkSaveButton.tsx`
- **Uwaga**: Wymaga tylko dodania tokenu do requestów (jak US-003)

**US-005: Edycja fiszek** ⏳ WYMAGA NOWEGO WIDOKU
- ❌ Brak widoku "Moje fiszki"
- ❌ Brak UI do edycji zapisanych fiszek
- ✅ Backend endpoint już istnieje → `/api/flashcards` (PUT)
- **Wymagane**: Nowa strona `/flashcards` lub `/my-flashcards` (Faza 9)

**US-006: Usuwanie fiszek** ⏳ WYMAGA NOWEGO WIDOKU
- ❌ Brak widoku "Moje fiszki"
- ❌ Brak UI do usuwania fiszek z listy
- ✅ Backend endpoint już istnieje → `/api/flashcards` (DELETE)
- **Wymagane**: Nowa strona `/flashcards` lub `/my-flashcards` (Faza 9)

**US-007: Ręczne tworzenie fiszek** ⏳ WYMAGA NOWEGO WIDOKU
- ❌ Brak widoku "Moje fiszki"
- ❌ Brak formularza do ręcznego tworzenia
- ✅ Backend endpoint już istnieje → `/api/flashcards` (POST)
- **Wymagane**: Nowa strona `/flashcards` z formularzem (Faza 9)

**US-008: Sesja nauki z algorytmem powtórek** ⏳ WYMAGA OSOBNEJ SPECYFIKACJI
- ❌ Brak widoku "Sesja nauki"
- ❌ Brak integracji z algorytmem spaced repetition
- ❌ Brak UI do oceny fiszek
- **Wymagane**: Nowa specyfikacja + implementacja (Faza 10)

**US-009: Bezpieczny dostęp i autoryzacja** ✅ W PEŁNI ZAIMPLEMENTOWANE
- ✅ Middleware weryfikuje sesję przed dostępem do `/generate`
- ✅ API endpoints weryfikują Bearer token
- ✅ Filtrowanie danych po `user_id` w serwisach
- ✅ Brak dostępu do danych innych użytkowników
- **Implementacja**: Middleware + Token verification we wszystkich endpointach

**PRD punkt 3, 7: Usuwanie konta (RODO)** ✅ ZAIMPLEMENTOWANE
- ✅ Endpoint DELETE /api/auth/account
- 🟡 **DO ZROBIENIA**: UI do usunięcia konta (w UserNav lub Settings)
- 🟡 **DO ZROBIENIA**: Potwierdzenie z hasłem przed usunięciem
- **Implementacja**: `/api/auth/account` (Faza 8)

**PRD punkt 6: Statystyki generowania** ⏳ WYMAGA IMPLEMENTACJI
- ❌ Brak endpointu do statystyk
- ❌ Brak widoku Dashboard
- ✅ Tabele w bazie są gotowe (generations, generation_error_logs)
- **Wymagane**: GET /api/statistics + widok Dashboard (Faza 11)

### 4.4 Nie Naruszone Istniejące Funkcjonalności

**Generowanie fiszek (US-003)**:
- ✅ Endpoint `/api/generations` pozostaje bez zmian (już ma auth)
- ✅ FlashcardGenerationView wymaga tylko dodania tokenu do requestów

**Zarządzanie fiszkami (US-004, US-005, US-006)**:
- ✅ Endpoint `/api/flashcards` pozostaje bez zmian (już ma auth)
- ✅ Walidacja `user_id` już istnieje w serwisach

**Baza danych**:
- ✅ Żadne zmiany w schemacie nie są wymagane
- ✅ Kolumny `user_id` już istnieją i są gotowe do użycia

### 4.5 Przepływ Danych

**Rejestracja**:
```
User → RegisterForm → POST /api/auth/register → Supabase Auth → DB (auth.users)
→ Response (userId) → Auto-login → localStorage (token) → Redirect /generate
```

**Logowanie**:
```
User → LoginForm → POST /api/auth/login → Supabase Auth → JWT Token
→ localStorage + Cookies → Redirect /generate
```

**Chroniony Request**:
```
FlashcardGenerationView → GET /api/generations
  Headers: { Authorization: `Bearer ${token}` }
→ Middleware → Token Validation → userId extraction
→ Service (with userId) → DB (filtered by user_id) → Response
```

**Wylogowanie**:
```
UserNav → POST /api/auth/logout → Supabase signOut
→ Clear cookies → Clear localStorage → Redirect /auth/login
```

### 4.6 Konfiguracja Środowiskowa

**Wymagane zmienne środowiskowe** (w `.env`):
- `SUPABASE_URL` - URL instancji Supabase (już istnieje)
- `SUPABASE_KEY` - Anon/Public key (już istnieje)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (już istnieje)
- `PUBLIC_SITE_URL` - URL aplikacji dla redirects (nowa)

**Aktualizacja `src/env.d.ts`**:
```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_SITE_URL: string; // Nowa zmienna
}
```

### 4.7 Kolejność Implementacji (Rekomendacja)

**Zakres tej specyfikacji (System Autentykacji - Fazy 1-7):**

1. **Faza 1: Backend Auth Endpoints**
   - Utworzenie endpointów register, login, logout
   - Walidacja i obsługa błędów
   - Testowanie przez Postman/curl

2. **Faza 2: Frontend Auth Components**
   - Utworzenie komponentów LoginForm, RegisterForm
   - Podstawowe style (Shadcn/ui)
   - Integracja z endpointami

3. **Faza 3: Middleware i Ochrona Stron**
   - Aktualizacja middleware dla sesji SSR
   - Dodanie ochrony do `/generate`
   - Logika przekierowań

4. **Faza 4: User Navigation**
   - Komponent UserNav
   - Wylogowanie
   - Wyświetlanie informacji użytkownika

5. **Faza 5: Password Recovery**
   - Endpointy forgot-password, reset-password
   - Komponenty formularzy resetowania
   - Konfiguracja email templates w Supabase

6. **Faza 6: Integracja z Istniejącymi Komponentami**
   - Dodanie tokenu do FlashcardGenerationView
   - Obsługa 401 i auto-logout
   - Aktualizacja strony głównej

7. **Faza 7: Testowanie i Poprawki**
   - Testy E2E przepływów auth
   - Obsługa edge cases
   - Optymalizacja UX

**Kolejne fazy (poza zakresem tej specyfikacji, wymagane przez PRD):**

8. **Faza 8: Account Deletion (RODO Compliance)**
   - Endpoint DELETE /api/auth/account
   - UI w UserNav lub Settings dla usunięcia konta
   - Potwierdzenie z hasłem
   - Usuwanie wszystkich powiązanych danych (CASCADE)

9. **Faza 9: Widok "Moje Fiszki" (US-005, US-006, US-007)**
   - Nowa strona `/flashcards` lub `/my-flashcards`
   - Lista wszystkich zapisanych fiszek użytkownika
   - Funkcje edycji i usuwania fiszek
   - Formularz do ręcznego tworzenia fiszek
   - Filtrowanie i sortowanie

10. **Faza 10: Sesja Nauki (US-008)**
    - Nowa strona `/learn` lub `/study`
    - Integracja z algorytmem spaced repetition (np. ts-fsrs)
    - UI do wyświetlania fiszek i oceniania trudności
    - Tracking postępów użytkownika

11. **Faza 11: Statystyki i Dashboard (PRD punkt 6)**
    - Endpoint GET /api/statistics
    - Widok ze statystykami generowania
    - Liczba wygenerowanych vs zaakceptowanych fiszek
    - Analiza jakości AI

### 4.8 Testowanie

**Scenariusze testowe**:
1. Rejestracja nowego użytkownika → sukces
2. Rejestracja z istniejącym emailem → błąd 409
3. Logowanie z poprawnymi danymi → sukces
4. Logowanie z błędnymi danymi → błąd 401
5. Dostęp do `/generate` bez logowania → przekierowanie
6. Dostęp do `/generate` po zalogowaniu → sukces
7. Wywołanie API z ważnym tokenem → sukces
8. Wywołanie API z nieważnym tokenem → błąd 401
9. Wylogowanie → czyszczenie sesji i przekierowanie
10. Reset hasła - pełny przepływ
11. **Usunięcie konta (RODO)** - pełny przepływ:
    - Zalogowanie
    - Utworzenie fiszek
    - Wywołanie DELETE /api/auth/account
    - Weryfikacja usunięcia danych z bazy
    - Weryfikacja usunięcia konta z Supabase Auth
12. Wygaśnięcie sesji podczas pracy → auto-logout i przekierowanie

**Narzędzia**:
- Postman/Insomnia dla testowania API
- Przeglądarka dev tools dla flow frontend
- Supabase Dashboard do weryfikacji users w `auth.users`

---

## 5. DIAGRAMY I KONTRAKTY

### 5.1 Kontrakt API

**Wszystkie endpointy zwracają JSON z nagłówkiem `Content-Type: application/json`**

**Format błędów**:
```typescript
{
  error: string; // Typ błędu (np. "Bad Request", "Unauthorized")
  message: string; // Czytelny komunikat
  details?: Array<{ path: string; message: string }>; // Opcjonalne szczegóły walidacji
}
```

**Format sukcesów**: Zależny od endpointu (zdefiniowane w sekcji 2.1)

### 5.2 Typy TypeScript

**Lokalizacja**: `src/types.ts` (aktualizacja istniejącego pliku)

**Nowe typy do dodania**:
```typescript
// --- AUTH DTOs (dodaj na początku pliku) ---

/** Request body for user registration */
export interface RegisterUserDto {
  email: string;
  password: string;
}

/** Response body after registering a user */
export interface RegisterUserResponseDto {
  userId: string;
  email: string;
  createdAt: string;
}

/** Request body for user login */
export interface LoginUserDto {
  email: string;
  password: string;
}

/** Response body after logging in */
export interface LoginUserResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
  };
}

/** Request body for forgot password */
export interface ForgotPasswordDto {
  email: string;
}

/** Request body for reset password */
export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

/** User info for authenticated requests */
export interface AuthUser {
  id: string;
  email: string;
}
```

### 5.3 Struktura Plików (Nowe i Zmodyfikowane)

```
src/
├── pages/
│   ├── index.astro (ZMODYFIKOWANY - dodanie przycisków auth)
│   ├── generate.astro (ZMODYFIKOWANY - ochrona przez middleware)
│   ├── auth/
│   │   ├── login.astro (NOWY)
│   │   ├── register.astro (NOWY)
│   │   ├── forgot-password.astro (NOWY)
│   │   ├── reset-password.astro (NOWY)
│   │   └── verify-email.astro (NOWY - opcjonalny)
│   └── api/
│       ├── auth/
│       │   ├── register.ts (NOWY)
│       │   ├── login.ts (NOWY)
│       │   ├── logout.ts (NOWY)
│       │   ├── forgot-password.ts (NOWY)
│       │   ├── reset-password.ts (NOWY)
│       │   ├── refresh.ts (NOWY - opcjonalny)
│       │   ├── me.ts (NOWY)
│       │   └── account.ts (NOWY - DELETE endpoint, WYMAGANY przez RODO)
│       ├── generations.ts (bez zmian - już ma auth)
│       └── flashcards.ts (bez zmian - już ma auth)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx (NOWY)
│   │   ├── RegisterForm.tsx (NOWY)
│   │   ├── ForgotPasswordForm.tsx (NOWY)
│   │   ├── ResetPasswordForm.tsx (NOWY)
│   │   └── UserNav.tsx (NOWY)
│   ├── FlashcardGenerationView.tsx (ZMODYFIKOWANY - dodanie tokenu)
│   └── Welcome.astro (ZMODYFIKOWANY - dodanie przycisków auth)
├── components/hooks/
│   └── useAuth.ts (NOWY)
├── middleware/
│   └── index.ts (ZMODYFIKOWANY - sprawdzanie sesji SSR)
├── db/
│   ├── supabase.client.ts (bez zmian)
│   └── database.types.ts (bez zmian)
├── types.ts (ZMODYFIKOWANY - dodanie typów auth)
└── env.d.ts (ZMODYFIKOWANY - nowy typ Locals.user)
```

---

## 6. UWAGI KOŃCOWE

### 6.1 Zgodność z Best Practices

- **Early returns**: Obsługa błędów na początku funkcji
- **Guard clauses**: Sprawdzanie warunków przed główną logiką
- **Type safety**: Pełne typowanie TypeScript
- **Separation of concerns**: Podział na warstwy (UI, API, Services)
- **DRY**: Reużywalne komponenty i funkcje
- **Security first**: HttpOnly cookies, walidacja, sanityzacja

### 6.2 Ograniczenia MVP

**Nie zawarte w tej specyfikacji** (zgodnie z PRD):
- Weryfikacja email (opcjonalna, można włączyć w Supabase)
- Social login (Google, GitHub, etc.)
- Two-factor authentication
- Rate limiting (można dodać w przyszłości)
- Email customization (używamy domyślnych templates Supabase)

**Będą dodane w dalszych fazach implementacji** (wymagane przez PRD):
- Account deletion endpoint (**WYMAGANE przez RODO i PRD punkt 3, 7**)
- Widok "Moje fiszki" do zarządzania zapisanymi fiszkami (**US-005, US-006, US-007**)
- Widok "Sesja nauki" z algorytmem spaced repetition (**US-008**)
- Dashboard ze statystykami generowania fiszek (**PRD punkt 6**)

### 6.3 Możliwości Rozbudowy

**Przyszłe funkcjonalności**:
- Profilowe strony użytkownika
- Zmiana hasła (bez resetu)
- Zmiana emaila
- Zarządzanie sesjami (lista aktywnych urządzeń)
- Audit log (historia logowań)
- OAuth providers
- API keys dla integracji

### 6.4 Dependency na Supabase

**Zalety**:
- Gotowy system auth out-of-the-box
- Zarządzanie sesjami i tokenami
- Email service wbudowany
- Skalowalność i bezpieczeństwo

**Wady**:
- Vendor lock-in (ale Supabase jest open-source)
- Zależność od zewnętrznej usługi
- Konieczność konfiguracji dashboard

**Mitigacja**:
- Abstrakcja logiki auth w serwisach
- Możliwość przejścia na self-hosted Supabase
- Dokumentacja procesu migracji (w razie potrzeby)

---

## CHANGELOG

### Wersja 1.1 - 2025-10-27
**Autor**: AI Assistant (Claude Sonnet 4.5)

**Zmiany po weryfikacji zgodności z PRD:**

1. **Dodano sekcję "ZAKRES DOKUMENTU"** (góra dokumentu)
   - Jasne określenie pokrycia User Stories
   - Mapowanie na fazy implementacji
   - Wyjaśnienie wymagań RODO

2. **Rozszerzono sekcję 2.1 o endpoint 2.1.7: DELETE /api/auth/account**
   - **WYMAGANY przez RODO** (PRD punkt 3, 7)
   - Usuwanie konta i wszystkich powiązanych danych
   - Cascade delete dla flashcards, generations, logs

3. **Zaktualizowano sekcję 4.3: Zgodność z Wymaganiami PRD**
   - Szczegółowe mapowanie każdego User Story
   - Status implementacji (✅ / 🟡 / ⏳ / ❌)
   - Powiązanie z konkretnymi plikami/komponentami
   - Identyfikacja braków (widok "Moje fiszki", "Sesja nauki", Statystyki)

4. **Rozszerzono sekcję 4.7: Kolejność Implementacji**
   - Podział na fazy w zakresie specyfikacji (1-7)
   - Dodano Fazę 8: Account Deletion (RODO)
   - Dodano Fazę 9: Widok "Moje fiszki" (US-005, US-006, US-007)
   - Dodano Fazę 10: Sesja nauki (US-008)
   - Dodano Fazę 11: Statystyki (PRD punkt 6)

5. **Zaktualizowano sekcję 6.2: Ograniczenia MVP**
   - Usunięto "Account deletion" z ograniczeń (jest wymagane!)
   - Przeniesiono brakujące funkcjonalności do osobnej sekcji "Będą dodane w dalszych fazach"

6. **Rozszerzono sekcję 4.8: Testowanie**
   - Dodano test usuwania konta (RODO compliance)
   - Dodano test wygasłej sesji

7. **Zaktualizowano strukturę plików (sekcja 5.3)**
   - Dodano `account.ts` (DELETE endpoint)
   - Oznaczono jako wymagany przez RODO

**Podsumowanie weryfikacji:**
- ✅ Wszystkie wymagania US-001, US-002, US-009 są pokryte
- ✅ Wymagania RODO (usuwanie konta) są uwzględnione
- ⚠️ Zidentyfikowano brakujące widoki (Moje fiszki, Sesja nauki, Statystyki)
- ⚠️ Brakujące funkcjonalności oznaczono jako kolejne fazy implementacji

---

### Wersja 1.0 - 2025-10-27
**Autor**: AI Assistant (Claude Sonnet 4.5)

**Pierwotna specyfikacja techniczna:**
- System autentykacji (rejestracja, logowanie, reset hasła)
- 6 endpointów API
- 5 komponentów React
- 4 strony Astro
- Integracja z Supabase Auth
- Middleware SSR
- Bezpieczeństwo (JWT, httpOnly cookies)

---

**Koniec specyfikacji technicznej**

Wersja: 1.1
Data ostatniej aktualizacji: 2025-10-27
Autorzy: AI Assistant (Claude Sonnet 4.5)

