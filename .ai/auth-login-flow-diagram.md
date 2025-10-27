# 🔄 Diagram Przepływu - Logowanie Użytkownika

## Przepływ Danych (Data Flow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROCES LOGOWANIA                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Browser    │
│ (User)       │
└──────┬───────┘
       │ 1. Wejście na /auth/login
       ▼
┌──────────────────────────────────────┐
│  Astro Middleware                    │
│  src/middleware/index.ts             │
├──────────────────────────────────────┤
│  ✓ createSupabaseServerInstance()   │
│  ✓ Sprawdza cookies (getAll)         │
│  ✓ auth.getUser()                    │
│  ✓ Jeśli user → Astro.locals.user    │
└──────┬───────────────────────────────┘
       │ 2. Przekazanie do strony
       ▼
┌──────────────────────────────────────┐
│  login.astro                         │
│  src/pages/auth/login.astro          │
├──────────────────────────────────────┤
│  if (Astro.locals.user) {            │
│    return Astro.redirect('/generate')│
│  }                                   │
│  → Renderuj LoginForm                │
└──────┬───────────────────────────────┘
       │ 3. SSR → HTML wysłany do klienta
       ▼
┌──────────────────────────────────────┐
│  LoginForm.tsx (React)               │
│  src/components/auth/LoginForm.tsx   │
├──────────────────────────────────────┤
│  ✓ Stan: email, password, error      │
│  ✓ Walidacja client-side             │
│  ✓ handleSubmit()                    │
└──────┬───────────────────────────────┘
       │ 4. User wypełnia formularz i klika "Zaloguj się"
       │
       │ 5. fetch POST /api/auth/login
       │    { email, password }
       ▼
┌──────────────────────────────────────────────────────────┐
│  Login API Endpoint                                      │
│  src/pages/api/auth/login.ts                             │
├──────────────────────────────────────────────────────────┤
│  1. Parsowanie JSON body                                 │
│  2. Walidacja Zod schema                                 │
│  3. createSupabaseServerInstance()                       │
│  4. supabase.auth.signInWithPassword()  ──────┐          │
│                                                │          │
│     ┌──────────────────────────────────────────┘          │
│     ▼                                                     │
│  ┌────────────────────────────────┐                      │
│  │   Supabase Auth                │                      │
│  │   (External Service)           │                      │
│  ├────────────────────────────────┤                      │
│  │ ✓ Weryfikacja email/password   │                      │
│  │ ✓ Generowanie JWT tokens       │                      │
│  │ ✓ Utworzenie sesji             │                      │
│  └────────┬───────────────────────┘                      │
│           │ Return: session + user                       │
│     ┌─────┘                                              │
│     ▼                                                     │
│  5. SSR automatycznie ustawia cookies (setAll):          │
│     - sb-access-token (httpOnly)                         │
│     - sb-refresh-token (httpOnly)                        │
│                                                           │
│  6. Response body:                                       │
│     {                                                     │
│       accessToken, refreshToken, expiresIn, user         │
│     }                                                     │
└───────────┬──────────────────────────────────────────────┘
            │ 7. HTTP 200 OK
            ▼
┌──────────────────────────────────────┐
│  LoginForm.tsx                       │
│  (handleSubmit callback)             │
├──────────────────────────────────────┤
│  if (response.ok) {                  │
│    ✓ Zapisz tokens w storage:       │
│      - localStorage (rememberMe)     │
│      - sessionStorage (default)      │
│    ✓ window.location.href='/generate'│
│  }                                   │
└──────┬───────────────────────────────┘
       │ 8. Client-side redirect
       ▼
┌──────────────────────────────────────┐
│  Browser → /generate                 │
│                                      │
│  ✓ Cookies wysłane w request         │
│  ✓ Middleware sprawdza sesję         │
│  ✓ Astro.locals.user ustawiony       │
│  ✓ Renderuje chronioną stronę        │
└──────────────────────────────────────┘
```

---

## Przepływ Sprawdzania Sesji (Middleware)

```
┌────────────────────────────────────────────────────────────┐
│         KAŻDE ŻĄDANIE DO SERWERA ASTRO                     │
└────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Request    │ (z cookies)
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Middleware                                     │
│  src/middleware/index.ts                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. context.locals.supabase = serviceClient     │
│     (dla operacji na danych)                    │
│                                                 │
│  2. supabase = createSupabaseServerInstance()   │
│     ├─ cookies.getAll()                         │
│     │  └─> parseCookieHeader()                  │
│     │      └─> [{name, value}, ...]             │
│     └─ zwraca auth client                       │
│                                                 │
│  3. { data: { user } } = await                  │
│     supabase.auth.getUser()                     │
│     │                                           │
│     ├─ Sprawdza sb-access-token w cookies       │
│     ├─ Weryfikuje JWT signature                 │
│     └─ Dekoduje token → user object             │
│                                                 │
│  4. if (user) {                                 │
│       context.locals.user = {                   │
│         id: user.id,                            │
│         email: user.email                       │
│       }                                         │
│     }                                           │
│                                                 │
│  5. return next()                               │
│     └─> Przekazanie do route handler           │
└─────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Astro Page              │
│  (np. generate.astro)    │
├──────────────────────────┤
│  const user =            │
│    Astro.locals.user     │
│                          │
│  if (!user) {            │
│    return Astro.redirect │
│           ('/auth/login')│
│  }                       │
│                          │
│  // Renderuj stronę      │
└──────────────────────────┘
```

---

## Mechanizm Cookies (SSR Auth)

```
┌───────────────────────────────────────────────────────────┐
│          SUPABASE SSR COOKIE MANAGEMENT                   │
└───────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐
│  createSupabaseServerInstance   │
├─────────────────────────────────┤
│                                 │
│  createServerClient(            │
│    supabaseUrl,                 │
│    supabaseAnonKey,             │
│    {                            │
│      cookieOptions: {           │
│        path: '/',               │
│        secure: true,            │
│        httpOnly: true,          │ ← XSS Protection
│        sameSite: 'lax',         │ ← CSRF Protection
│      },                         │
│      cookies: {                 │
│        getAll() {               │ ← READ cookies
│          return                 │
│            parseCookieHeader(   │
│              headers.get(       │
│                'Cookie'         │
│              )                  │
│            )                    │
│        },                       │
│        setAll(cookiesToSet) {   │ ← WRITE cookies
│          cookiesToSet.forEach(  │
│            ({ name, value,      │
│               options }) => {   │
│              cookies.set(       │
│                name,            │
│                value,           │
│                options          │
│              )                  │
│            }                    │
│          )                      │
│        }                        │
│      }                          │
│    }                            │
│  )                              │
└─────────────────────────────────┘

     │ Po signInWithPassword()
     ▼
┌─────────────────────────────────┐
│  Supabase SSR automatycznie:    │
│                                 │
│  setAll([                       │
│    {                            │
│      name: 'sb-access-token',   │
│      value: 'eyJhbG...',        │ ← JWT Token (1h)
│      options: {                 │
│        httpOnly: true,          │
│        secure: true,            │
│        sameSite: 'lax',         │
│        maxAge: 3600             │
│      }                          │
│    },                           │
│    {                            │
│      name: 'sb-refresh-token',  │
│      value: 'abc123...',        │ ← Refresh (7d)
│      options: {                 │
│        httpOnly: true,          │
│        secure: true,            │
│        sameSite: 'lax',         │
│        maxAge: 604800           │
│      }                          │
│    }                            │
│  ])                             │
└─────────────────────────────────┘

     │ Każdy kolejny request
     ▼
┌─────────────────────────────────┐
│  Browser automatycznie wysyła:  │
│                                 │
│  Cookie:                        │
│    sb-access-token=eyJ...;      │
│    sb-refresh-token=abc...      │
│                                 │
│  → Middleware → getAll() →      │
│    parseCookieHeader() →        │
│    auth.getUser() →             │
│    Astro.locals.user ✓          │
└─────────────────────────────────┘
```

---

## Hybrid Storage Strategy

```
┌────────────────────────────────────────────────────────┐
│              GDZIE SĄ PRZECHOWYWANE TOKENY?            │
└────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────────────┐
│  Server-side     │         │  Client-side             │
│  (Automatic)     │         │  (Manual)                │
├──────────────────┤         ├──────────────────────────┤
│                  │         │                          │
│  Cookies:        │         │  If rememberMe = true:   │
│  ┌─────────────┐ │         │  ┌─────────────────────┐ │
│  │ httpOnly ✓  │ │         │  │ localStorage        │ │
│  │ secure ✓    │ │         │  │ ├─ access-token     │ │
│  │ sameSite ✓  │ │         │  │ └─ refresh-token    │ │
│  │             │ │         │  └─────────────────────┘ │
│  │ sb-access-  │ │         │                          │
│  │   token     │ │         │  If rememberMe = false:  │
│  │             │ │         │  ┌─────────────────────┐ │
│  │ sb-refresh- │ │         │  │ sessionStorage      │ │
│  │   token     │ │         │  │ ├─ access-token     │ │
│  └─────────────┘ │         │  │ └─ refresh-token    │ │
│                  │         │  └─────────────────────┘ │
│  Używane przez:  │         │                          │
│  • Middleware    │         │  Używane przez:          │
│  • SSR Pages     │         │  • React Components      │
│  • API Routes    │         │  • Client-side requests  │
│                  │         │  • fetch() with headers  │
└──────────────────┘         └──────────────────────────┘

     │                              │
     │                              │
     └──────────────┬───────────────┘
                    │
                    ▼
     ┌──────────────────────────────┐
     │   WHY HYBRID?                │
     ├──────────────────────────────┤
     │                              │
     │ 1. Cookies (httpOnly) =      │
     │    bezpieczne dla SSR        │
     │    (nie można ukraść przez   │
     │     XSS attack)              │
     │                              │
     │ 2. localStorage =            │
     │    wygodne dla React         │
     │    components które robią    │
     │    API requests              │
     │                              │
     │ 3. Redundancja =             │
     │    jeśli jeden failuje,      │
     │    drugi działa              │
     │                              │
     └──────────────────────────────┘
```

---

## Error Handling Flow

```
┌────────────────────────────────────────┐
│       OBSŁUGA BŁĘDÓW                   │
└────────────────────────────────────────┘

POST /api/auth/login
│
├─ Parsing JSON
│  └─ FAIL → 400 Bad Request
│            "Invalid JSON"
│
├─ Zod Validation
│  └─ FAIL → 400 Bad Request
│            { details: [...] }
│
├─ Supabase signInWithPassword()
│  │
│  ├─ Nieprawidłowe dane
│  │  └─ 401 Unauthorized
│  │     "Invalid email or password"
│  │
│  ├─ User niezweryfikowany
│  │  └─ 401 Unauthorized
│  │     "Email not verified"
│  │
│  ├─ Rate limit exceeded
│  │  └─ 429 Too Many Requests
│  │     "Too many login attempts"
│  │
│  └─ Supabase down/error
│     └─ 500 Internal Server Error
│        "Authentication failed"
│
└─ Unexpected error (catch)
   └─ 500 Internal Server Error
      "An unexpected error occurred"

   ▼
┌────────────────────────────────────────┐
│  LoginForm.tsx                         │
├────────────────────────────────────────┤
│                                        │
│  if (!response.ok) {                   │
│    setState({                          │
│      error: data.message               │
│    })                                  │
│    → ErrorNotification displays        │
│  }                                     │
│                                        │
│  catch (error) {                       │
│    setState({                          │
│      error: "Nie udało się połączyć    │
│              z serwerem"               │
│    })                                  │
│  }                                     │
└────────────────────────────────────────┘
```

---

## Security Layers

```
┌────────────────────────────────────────────────────┐
│              WARSTWY BEZPIECZEŃSTWA                │
└────────────────────────────────────────────────────┘

Layer 1: Client-side Validation
┌──────────────────────────────┐
│  LoginForm.tsx               │
│  ✓ Email format (regex)      │
│  ✓ Password not empty        │
│  ✓ Disable button if invalid │
└──────────────────────────────┘
         │
         ▼
Layer 2: Server-side Validation
┌──────────────────────────────┐
│  /api/auth/login.ts          │
│  ✓ Zod schema validation     │
│  ✓ Type safety (TypeScript)  │
└──────────────────────────────┘
         │
         ▼
Layer 3: Supabase Auth
┌──────────────────────────────┐
│  Supabase Service            │
│  ✓ Password hashing (bcrypt) │
│  ✓ JWT signing/verification  │
│  ✓ Rate limiting             │
│  ✓ Session management        │
└──────────────────────────────┘
         │
         ▼
Layer 4: Cookie Security
┌──────────────────────────────┐
│  Browser Cookies             │
│  ✓ httpOnly (no JS access)   │
│  ✓ secure (HTTPS only)       │
│  ✓ sameSite: lax (CSRF)      │
└──────────────────────────────┘
         │
         ▼
Layer 5: Middleware Verification
┌──────────────────────────────┐
│  src/middleware/index.ts     │
│  ✓ JWT verification on every │
│    request                   │
│  ✓ User extraction from token│
└──────────────────────────────┘
```

---

## Token Lifecycle

```
┌────────────────────────────────────────────────────┐
│              CYKL ŻYCIA TOKENU                     │
└────────────────────────────────────────────────────┘

T=0: Login
┌────────────────────────┐
│ POST /api/auth/login   │
│ → Supabase generuje:   │
│   • Access Token (1h)  │
│   • Refresh Token (7d) │
└────────────────────────┘

T=0 - T=59min: Active Session
┌────────────────────────┐
│ Every request:         │
│ → Access Token valid   │
│ → Middleware extracts  │
│   user from token      │
│ → Astro.locals.user ✓  │
└────────────────────────┘

T=60min: Token Expired
┌────────────────────────┐
│ Request fails:         │
│ → Access Token invalid │
│ → auth.getUser() fails │
│ → Astro.locals.user = undefined
│ → Redirect to /login   │
└────────────────────────┘

Future: Auto Refresh (TODO)
┌────────────────────────┐
│ useAuth hook:          │
│ → Sprawdza exp w JWT   │
│ → Przed wygaśnięciem   │
│   wywołuje             │
│   refreshSession()     │
│ → Nowy Access Token    │
└────────────────────────┘
```

---

**Koniec diagramów**

Dla lepszego zrozumienia implementacji, przejrzyj również:
- `.ai/auth-login-implementation-summary.md` - szczegółowa dokumentacja
- `.ai/auth-login-quick-start.md` - instrukcja testowania

