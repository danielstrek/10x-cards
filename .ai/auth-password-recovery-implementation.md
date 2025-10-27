# Implementacja Password Recovery - Priorytet 2

**Data**: 2025-10-27  
**Status**: ✅ Zakończone  
**Zgodność**: auth-spec.md (Faza 5), Best Practices

---

## 🎯 Zakres Implementacji

Zaimplementowano kompletny system resetowania hasła:
1. ✅ POST /api/auth/forgot-password - wysyłanie linku resetującego
2. ✅ POST /api/auth/reset-password - ustawianie nowego hasła
3. ✅ ForgotPasswordForm.tsx - formularz żądania resetu
4. ✅ ResetPasswordForm.tsx - formularz nowego hasła
5. ✅ forgot-password.astro - strona żądania resetu
6. ✅ reset-password.astro - strona ustawania nowego hasła

---

## 📁 Utworzone Pliki

### 1. **src/pages/api/auth/forgot-password.ts** 🆕

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK)** - Zawsze sukces (security):
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Kluczowe funkcje**:
- ✅ Walidacja email (Zod)
- ✅ `supabase.auth.resetPasswordForEmail()`
- ✅ **Security**: Zawsze zwraca sukces (zapobiega email enumeration)
- ✅ Redirect URL: `/auth/reset-password`
- ✅ PUBLIC_SITE_URL support

**Security Best Practice**:
```typescript
// IMPORTANT: Always return success (security best practice)
// Don't reveal whether the email exists in the system
if (error) {
  console.error('Supabase password reset error:', error);
  // Still return success to user (don't reveal error details)
}
```

---

### 2. **src/pages/api/auth/reset-password.ts** 🆕

**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
  "password": "NewSecurePass123!"
}
```

**Uwaga**: Token resetowania jest w cookies (Supabase SSR)

**Response (200 OK)**:
```json
{
  "message": "Password has been reset successfully"
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired reset token"
}
```

**Kluczowe funkcje**:
- ✅ Walidacja hasła (8+, uppercase, digit, special)
- ✅ `supabase.auth.getUser()` - sprawdza token z cookies
- ✅ `supabase.auth.updateUser({ password })` - update hasła
- ✅ Automatyczne logowanie po zmianie hasła

**Flow**:
1. User klika link z emaila → Supabase ustawia token w cookies
2. POST /api/auth/reset-password z nowym hasłem
3. getUser() sprawdza token z cookies
4. updateUser() zmienia hasło
5. User jest zalogowany z nowym hasłem

---

### 3. **src/components/auth/ForgotPasswordForm.tsx** 🆕

**Stan komponentu**:
```typescript
interface ForgotPasswordFormState {
  email: string;
  isLoading: boolean;
  error: string | null;
  emailSent: boolean; // Success state
}
```

**Funkcjonalności**:
- ✅ Input email z walidacją client-side
- ✅ Submit → POST /api/auth/forgot-password
- ✅ Success screen po wysłaniu
- ✅ Przycisk "Wyślij ponownie"
- ✅ Link powrotny do logowania
- ✅ Loading state ze spinnerem
- ✅ Error handling z ErrorNotification

**Success Screen**:
```tsx
if (state.emailSent) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📧 Email wysłany!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50">
          <p>Link wysłany na {email}</p>
        </div>
        <p>Link ważny przez 60 minut</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => window.location.href = '/auth/login'}>
          Powrót do logowania
        </Button>
        <Button variant="outline" onClick={resetForm}>
          Wyślij ponownie
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### 4. **src/components/auth/ResetPasswordForm.tsx** 🆕

**Stan komponentu**:
```typescript
interface ResetPasswordFormState {
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
```

**Funkcjonalności**:
- ✅ Dwa inputy: password + confirmPassword
- ✅ Show/hide password toggles (oba pola)
- ✅ Real-time password validation:
  - Min. 8 znaków
  - Wielka litera
  - Cyfra
  - Znak specjalny
- ✅ Password match validation
- ✅ Submit → POST /api/auth/reset-password
- ✅ Success screen z auto-redirect (3s)
- ✅ Obsługa wygasłego tokenu (401)

**Password Validation UI**:
```tsx
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
```

**Success Screen z Auto-Redirect**:
```tsx
if (state.success) {
  // Auto-redirect after 3 seconds
  setTimeout(() => {
    window.location.href = '/auth/login';
  }, 3000);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>✅ Hasło zmienione!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50">
          <p>Możesz teraz zalogować się używając nowego hasła</p>
        </div>
        <p className="text-xs">Przekierowanie za 3 sekundy...</p>
      </CardContent>
    </Card>
  );
}
```

---

### 5. **src/pages/auth/forgot-password.astro** 🆕

**Strona SSR**:
```astro
---
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
---

<Layout title="Resetuj hasło - 10x Cards">
  <ForgotPasswordForm client:load />
</Layout>
```

**Uwaga**: Nie sprawdzamy `Astro.locals.user` - user może chcieć zresetować hasło będąc zalogowanym

---

### 6. **src/pages/auth/reset-password.astro** 🆕

**Strona SSR**:
```astro
---
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

// Token is automatically handled by Supabase SSR (in cookies)
// No need to parse URL params
---

<Layout title="Ustaw nowe hasło - 10x Cards">
  <ResetPasswordForm client:load />
</Layout>
```

**Uwaga**: Token resetowania jest automatycznie obsługiwany przez Supabase SSR w cookies

---

## 🔄 Przepływ Użytkownika (Full Flow)

### Scenariusz: Zapomniałem Hasła

```
1. User na /auth/login
   ↓
2. Klika link "Zapomniałeś hasła?"
   ↓
3. Redirect → /auth/forgot-password
   ↓
4. Wypełnia formularz: email@example.com
   ↓
5. Submit → POST /api/auth/forgot-password
   ↓
6. Supabase wysyła email z linkiem:
   https://your-app.com/auth/reset-password?token=...
   ↓
7. Success screen: "📧 Email wysłany!"
   ↓
8. User sprawdza skrzynkę email
   ↓
9. Klika link z emaila
   ↓
10. Supabase SSR:
    - Parsuje token z URL
    - Ustawia token w cookies (httpOnly)
    - Redirect na /auth/reset-password
   ↓
11. /auth/reset-password renderuje się
    - ResetPasswordForm displayed
   ↓
12. User wypełnia nowe hasło:
    - Password: NewPass123!
    - Confirm: NewPass123!
    ↓
13. Real-time validation ✓
    ↓
14. Submit → POST /api/auth/reset-password
    ↓
15. Backend:
    - getUser() z cookies (token validation)
    - updateUser({ password })
    ↓
16. Success! User zalogowany z nowym hasłem
    ↓
17. Success screen z auto-redirect (3s)
    ↓
18. Redirect → /auth/login
    ↓
19. User loguje się z nowym hasłem
    ✅ SUKCES!
```

---

## 🔧 Konfiguracja Supabase

### Krok 1: Email Templates

Przejdź do Supabase Dashboard:
1. **Authentication** → **Email Templates**
2. Znajdź template: **"Reset Password"**

### Krok 2: Dostosuj Template (Opcjonalnie)

**Domyślny template Supabase**:
```html
<h2>Reset Your Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?token={{ .Token }}">Reset Password</a></p>
```

**Zalecany template (po polsku)**:
```html
<h2>Resetowanie hasła - 10x Cards</h2>

<p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>

<p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .SiteURL }}/auth/reset-password?token={{ .TokenHash }}&type=recovery" 
     style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    Zresetuj hasło
  </a>
</p>

<p><strong>Link jest ważny przez 60 minut.</strong></p>

<p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>

<p style="color: #666; font-size: 12px;">
  Lub skopiuj i wklej ten link do przeglądarki:<br>
  {{ .SiteURL }}/auth/reset-password?token={{ .TokenHash }}&type=recovery
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 11px;">
  Ta wiadomość została wysłana automatycznie. Nie odpowiadaj na nią.
</p>
```

### Krok 3: Ustaw Site URL

1. **Settings** → **General** → **Site URL**
2. Development: `http://localhost:3000`
3. Production: `https://your-domain.com`

### Krok 4: Redirect URLs (Whitelist)

1. **Authentication** → **URL Configuration** → **Redirect URLs**
2. Dodaj:
   - `http://localhost:3000/auth/reset-password` (dev)
   - `https://your-domain.com/auth/reset-password` (prod)

### Krok 5: Token Expiry (Opcjonalnie)

1. **Authentication** → **Settings** → **Security**
2. **Password Recovery Token Expiry**: `3600` (60 minut - domyślne)
3. Można zmienić na dłuższy/krótszy czas

---

## 🧪 Instrukcja Testowania

### Przygotowanie

1. **Supabase Email Templates** - skonfigurowane (powyżej)
2. **SMTP Configured** - Supabase używa własnego SMTP (działa out-of-box)
3. **Test User** - istniejący użytkownik w systemie

### TEST 1: Forgot Password Flow

**Kroki**:
1. Otwórz http://localhost:3000/auth/login
2. Kliknij link **"Zapomniałeś hasła?"**
3. Sprawdź URL: `/auth/forgot-password`
4. Wypełnij email: `test@example.com` (istniejący user)
5. Kliknij **"Wyślij link resetujący"**

**Oczekiwany rezultat**:
- ✅ Button: "Wysyłanie..." ze spinnerem
- ✅ Po 1-2 sek → Success screen:
  - "📧 Email wysłany!"
  - Zielone pole z komunikatem
  - Przyciski: "Powrót do logowania" / "Wyślij ponownie"

---

### TEST 2: Email Delivery

**Kroki**:
1. Sprawdź skrzynkę email: `test@example.com`
2. Poczekaj ~30 sekund (Supabase wysyła async)

**Oczekiwany rezultat**:
- ✅ Email od Supabase z tematem "Reset Your Password" (lub custom)
- ✅ Link w emailu: `http://localhost:3000/auth/reset-password?token=...&type=recovery`
- ✅ Token jest długim stringiem (JWT)

**Jeśli email nie przyszedł**:
- Sprawdź folder spam
- Sprawdź Supabase Dashboard → Logs → Email logs
- Sprawdź czy email istnieje w Users

---

### TEST 3: Reset Password (Poprawny Token)

**Kroki**:
1. Kliknij link z emaila
2. Browser otwiera: `/auth/reset-password`
3. Sprawdź DevTools → Application → Cookies:
   - `sb-access-token` powinien być ustawiony (z tokenem recovery)
4. Wypełnij formularz:
   - Password: `NewTestPass123!`
   - Confirm: `NewTestPass123!`
5. Obserwuj real-time validation
6. Kliknij **"Ustaw nowe hasło"**

**Oczekiwany rezultat**:
- ✅ Button: "Resetowanie..." ze spinnerem
- ✅ Po 1-2 sek → Success screen:
  - "✅ Hasło zmienione!"
  - "Przekierowanie za 3 sekundy..."
- ✅ Po 3 sek → automatyczny redirect na `/auth/login`

---

### TEST 4: Login z Nowym Hasłem

**Kroki**:
1. Na stronie login wypełnij:
   - Email: `test@example.com`
   - Password: `NewTestPass123!` (nowe hasło!)
2. Kliknij "Zaloguj się"

**Oczekiwany rezultat**:
- ✅ Sukces! Redirect na `/generate`
- ✅ UserNav wyświetlony
- ✅ Nowe hasło działa!

---

### TEST 5: Reset z Nieistniejącym Emailem (Security)

**Kroki**:
1. /auth/forgot-password
2. Wpisz: `nonexistent@example.com`
3. Submit

**Oczekiwany rezultat**:
- ✅ Success screen: "Email wysłany!" (nie ujawnia że email nie istnieje!)
- ✅ Brak emaila wysłanego (security best practice)
- ✅ Network tab: 200 OK (nie 404!)

---

### TEST 6: Reset z Wygasłym Tokenem

**Kroki**:
1. Kliknij stary link reset (> 60 min) lub użyj invalid token
2. Wypełnij formularz nowego hasła
3. Submit

**Oczekiwany rezultat**:
- ✅ ErrorNotification:
  - "Link resetujący wygasł lub jest nieprawidłowy. Spróbuj ponownie."
- ✅ HTTP 401 Unauthorized
- ✅ User pozostaje na /auth/reset-password

---

### TEST 7: Walidacja Hasła

**Kroki**:
1. Na /auth/reset-password wpisz słabe hasło:
   - Password: `short` (za krótkie)
   - Obserwuj błędy

**Oczekiwany rezultat**:
- ✅ Komunikaty błędów (real-time):
  - "• Hasło musi mieć co najmniej 8 znaków"
  - "• Hasło musi zawierać wielką literę"
  - "• Hasło musi zawierać cyfrę"
  - "• Hasło musi zawierać znak specjalny"
- ✅ Przycisk "Ustaw nowe hasło" disabled

**Kroki**:
2. Popraw hasło stopniowo: `Short1!`
3. Obserwuj jak błędy znikają

**Oczekiwany rezultat**:
- ✅ Każdy spełniony wymóg znika z listy
- ✅ Gdy wszystkie spełnione: "✓ Hasło spełnia wymagania"
- ✅ Przycisk enabled

---

### TEST 8: Password Mismatch

**Kroki**:
1. Password: `NewPass123!`
2. Confirm: `NewPass123` (brak !)
3. Obserwuj komunikat

**Oczekiwany rezultat**:
- ✅ "✗ Hasła nie są identyczne" (czerwony)
- ✅ Przycisk disabled

**Kroki**:
4. Popraw confirm: `NewPass123!`

**Oczekiwany rezultat**:
- ✅ "✓ Hasła są identyczne" (zielony)
- ✅ Przycisk enabled

---

### TEST 9: Network Requests

**Kroki**:
1. DevTools → Network tab
2. Submit forgot-password form

**Oczekiwany rezultat**:
```
POST /api/auth/forgot-password
Status: 200 OK
Response:
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Kroki**:
3. Reset password form submit

**Oczekiwany rezultat**:
```
POST /api/auth/reset-password
Status: 200 OK
Response:
{
  "message": "Password has been reset successfully"
}

Headers (Set-Cookie):
- sb-access-token=...; (logged in with new password)
```

---

### TEST 10: Auto-Redirect Timer

**Kroki**:
1. Po sukcesie reset password, obserwuj timer
2. Sprawdź czy pokazuje "Przekierowanie za 3 sekundy..."
3. Czekaj 3 sekundy

**Oczekiwany rezultat**:
- ✅ Automatyczny redirect na `/auth/login` po 3 sek
- ✅ Nie trzeba klikać przycisku

---

## 🔒 Security Features

### 1. Email Enumeration Prevention
```typescript
// ALWAYS return success - don't reveal if email exists
return new Response(
  JSON.stringify({
    message: 'If the email exists, a password reset link has been sent',
  }),
  { status: 200 }
);
```

### 2. Token w Cookies (httpOnly)
- ✅ Token nigdy nie jest w URL params na stronie
- ✅ Supabase SSR automatycznie parsuje z URL → cookies
- ✅ httpOnly = JavaScript nie ma dostępu
- ✅ Bezpieczne przed XSS

### 3. Token Expiry
- ✅ Domyślnie: 60 minut
- ✅ Po wygaśnięciu: 401 Unauthorized
- ✅ User musi zresetować ponownie

### 4. Password Strength
- ✅ Min. 8 znaków
- ✅ Wielka litera
- ✅ Cyfra
- ✅ Znak specjalny
- ✅ Server-side validation (Zod)
- ✅ Client-side real-time feedback

### 5. HTTPS Only (Production)
- ✅ secure: true w cookies
- ✅ Links w emailu używają HTTPS

---

## 📊 Status Compliance

### Auth Spec (Faza 5):
- ✅ POST /api/auth/forgot-password - **COMPLETE**
- ✅ POST /api/auth/reset-password - **COMPLETE**
- ✅ ForgotPasswordForm.tsx - **COMPLETE**
- ✅ ResetPasswordForm.tsx - **COMPLETE**
- ✅ forgot-password.astro - **COMPLETE**
- ✅ reset-password.astro - **COMPLETE**

### Security Best Practices:
- ✅ Email enumeration prevention
- ✅ Token w httpOnly cookies
- ✅ Token expiry (60 min)
- ✅ Password strength validation
- ✅ HTTPS support

---

## 🐛 Common Issues & Solutions

### Issue 1: Email nie przychodzi
**Symptoms**: Formularz wysłany, success screen, ale brak emaila

**Solutions**:
1. Sprawdź folder spam
2. Supabase Dashboard → Logs → Email logs
3. Sprawdź czy email istnieje w Users table
4. Sprawdź SMTP config (Supabase używa własnego - powinno działać)

---

### Issue 2: "Invalid or expired reset token"
**Symptoms**: 401 error na /api/auth/reset-password

**Solutions**:
1. Token wygasł (> 60 min) - użyj nowego linku
2. Token użyty już raz - można użyć tylko raz
3. Cookies blocked - sprawdź browser settings
4. Wrong URL - użyj dokładnego linku z emaila

---

### Issue 3: Reset page pokazuje się bez formularza
**Symptoms**: Blank page lub redirect loop

**Solutions**:
1. Token nie w cookies - sprawdź DevTools → Cookies
2. Supabase SSR nie działa - sprawdź middleware
3. Redirect URL whitelist - dodaj w Supabase Dashboard

---

### Issue 4: Password validation nie działa
**Symptoms**: Button disabled mimo poprawnego hasła

**Solutions**:
1. Sprawdź wszystkie 4 wymagania
2. Confirm password musi być identyczny
3. Sprawdź console errors
4. Re-type hasło (może być whitespace)

---

## ✅ Checklist Zakończenia

- [x] Endpoint POST /api/auth/forgot-password
- [x] Endpoint POST /api/auth/reset-password
- [x] Component ForgotPasswordForm.tsx
- [x] Component ResetPasswordForm.tsx
- [x] Strona forgot-password.astro
- [x] Strona reset-password.astro
- [x] Security: email enumeration prevention
- [x] Security: token w httpOnly cookies
- [x] Walidacja hasła (client + server)
- [x] Success screens z auto-redirect
- [x] Error handling
- [x] Dokumentacja konfiguracji Supabase
- [x] Instrukcje testowania (10 testów)
- [x] All linter checks - ✅ PASS

---

## 📚 Dokumentacja Powiązana

- **Priorytet 1**: `.ai/auth-priority1-implementation-summary.md`
- **Login**: `.ai/auth-login-implementation-summary.md`
- **Spec**: `.ai/auth-spec.md`
- **Examples**: `.ai/auth-usage-examples.md`

---

**Status**: ✅ **PRIORYTET 2 ZAKOŃCZONY - GOTOWE DO TESTOWANIA**

Kompletny system resetowania hasła zgodny ze specyfikacją i security best practices!

