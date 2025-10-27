# 🚀 Quick Start - Testowanie Logowania

## Wymagania

1. **Supabase Account** z skonfigurowanym projektem
2. **Email Auth włączony** w Supabase Dashboard → Authentication → Providers
3. **Testowy użytkownik** utworzony w Supabase

---

## Krok 1: Utworzenie testowego użytkownika w Supabase

### Opcja A: Przez Supabase Dashboard
1. Otwórz Supabase Dashboard
2. Idź do **Authentication** → **Users**
3. Kliknij **Add user** → **Create new user**
4. Wypełnij:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Auto Confirm User: ✅ (zaznacz)
5. Kliknij **Create user**

### Opcja B: Przez SQL (szybsza)
1. W Supabase Dashboard → **SQL Editor**
2. Uruchom:
```sql
-- Sprawdź czy istnieje
SELECT email FROM auth.users WHERE email = 'test@example.com';

-- Jeśli nie istnieje, utwórz przez register endpoint (po implementacji)
-- lub przez dashboard
```

---

## Krok 2: Sprawdź zmienne środowiskowe

Upewnij się, że masz plik `.env` w root projektu:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=your-openrouter-key
```

> ⚠️ **NIGDY** nie commituj pliku `.env` do repozytorium!

---

## Krok 3: Uruchom dev server

```bash
npm run dev
```

Powinno otworzyć się na http://localhost:3000

---

## Krok 4: Testuj logowanie

### Test podstawowy:
1. Otwórz http://localhost:3000/auth/login
2. Wprowadź dane:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. Kliknij **"Zaloguj się"**

### ✅ Oczekiwany rezultat:
- Przycisk pokazuje "Logowanie..." ze spinnerem
- Po ~1-2 sekundach → przekierowanie na `/generate`
- W DevTools (F12) → Application → Cookies:
  - Widzisz `sb-access-token` i `sb-refresh-token`
- W Console: brak błędów

### ❌ Jeśli coś nie działa:

**Błąd: "Invalid email or password"**
- Sprawdź czy użytkownik istnieje w Supabase Dashboard
- Sprawdź czy hasło jest poprawne
- Sprawdź czy email jest confirmed (Auto Confirm User)

**Błąd: "Nie udało się połączyć z serwerem"**
- Sprawdź czy dev server działa
- Sprawdź Console (F12) - czy są błędy 500?
- Sprawdź terminal - czy endpoint `/api/auth/login` zwraca błędy?

**Błąd: "SUPABASE_URL is not defined"**
- Sprawdź plik `.env`
- Zrestartuj dev server (`Ctrl+C` i `npm run dev`)

---

## Krok 5: Sprawdź cookies i tokens

### W przeglądarce (Chrome/Edge):
1. Naciśnij `F12` → zakładka **Application**
2. W lewym menu:
   - **Cookies** → `http://localhost:3000`:
     - `sb-access-token` (długi string JWT)
     - `sb-refresh-token` (długi string)
   - **Local Storage** (jeśli zaznaczyłeś "Zapamiętaj mnie"):
     - `sb-access-token`
     - `sb-refresh-token`
   - **Session Storage** (jeśli NIE zaznaczyłeś):
     - `sb-access-token`
     - `sb-refresh-token`

### Dekodowanie JWT tokenu (opcjonalnie):
1. Skopiuj wartość `sb-access-token`
2. Otwórz https://jwt.io
3. Wklej token
4. Sprawdź payload:
```json
{
  "sub": "user-uuid-here",
  "email": "test@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Krok 6: Test auto-redirect dla zalogowanych

1. Będąc zalogowanym, wejdź ponownie na `/auth/login`
2. **Oczekiwany rezultat**: Natychmiastowe przekierowanie na `/generate` (bez wyświetlenia formularza)

---

## Krok 7: Test middleware (Astro.locals.user)

Dodaj tymczasowo w `src/pages/auth/login.astro` (na początku `---` bloku):

```astro
---
console.log('User from middleware:', Astro.locals.user);
// reszta kodu...
---
```

**Wynik w terminalu (server-side log)**:
- Przed zalogowaniem: `User from middleware: undefined`
- Po zalogowaniu: `User from middleware: { id: '...', email: 'test@example.com' }`

> Usuń ten log po teście

---

## 🐛 Debugging

### Sprawdź logi serwera (terminal):
```
[11:30:45] GET /auth/login 200 (middleware executed)
[11:30:50] POST /api/auth/login 200 (login successful)
```

### Sprawdź Network tab (F12):
1. Otwórz **Network** tab przed kliknięciem "Zaloguj się"
2. Po kliknięciu powinien pojawić się:
   - `POST /api/auth/login` → Status 200
   - Response body:
     ```json
     {
       "accessToken": "eyJ...",
       "refreshToken": "...",
       "expiresIn": 3600,
       "user": {
         "id": "...",
         "email": "test@example.com"
       }
     }
     ```

### Common issues:

**CORS error w konsoli**:
- Nie powinno się zdarzyć (same-origin)
- Jeśli wystąpi, sprawdź czy endpoint ma `export const prerender = false;`

**TypeError: Cannot read property 'email' of undefined**:
- Supabase nie zwrócił użytkownika
- Sprawdź Supabase credentials w `.env`
- Sprawdź Supabase Dashboard → Settings → API (URL i Keys)

---

## ✅ Sukces!

Jeśli wszystkie testy przeszły, integracja logowania działa poprawnie! 🎉

### Następne kroki:
1. Implementacja `/api/auth/logout`
2. Implementacja `/api/auth/register`
3. Ochrona strony `/generate` (sprawdzenie `Astro.locals.user`)
4. Komponent UserNav (wyświetlanie email i przycisk logout)

---

## 📚 Dokumentacja szczegółowa

Pełna dokumentacja implementacji: `.ai/auth-login-implementation-summary.md`

Specyfikacja techniczna: `.ai/auth-spec.md`

