# 🚀 Quick Test - Password Recovery

## Szybki Test w 5 Minut

### ⚙️ Przygotowanie (1 min)

1. **Supabase Email Templates** (one-time setup):
   - Supabase Dashboard → Authentication → Email Templates
   - Template "Reset Password" jest już skonfigurowany ✅
   - (Opcjonalnie) Dostosuj do języka polskiego

2. **Zmienne środowiskowe** w `.env`:

```env
PUBLIC_SITE_URL=http://localhost:3000
```

3. **Uruchom dev server**:

```bash
npm run dev
```

---

## 🧪 Test Flow (4 min)

### ✅ TEST 1: Forgot Password (1 min)

1. Otwórz http://localhost:3000/auth/login
2. Kliknij **"Zapomniałeś hasła?"**
3. Wprowadź email istniejącego użytkownika: `test@example.com`
4. Kliknij **"Wyślij link resetujący"**

**Oczekiwany rezultat**:

- ✅ Button: "Wysyłanie..." ze spinnerem
- ✅ Success screen: "📧 Email wysłany!"
- ✅ Zielone pole z komunikatem
- ✅ 2 przyciski: "Powrót do logowania" / "Wyślij ponownie"

---

### ✅ TEST 2: Email Delivery (1 min)

1. Sprawdź skrzynkę email: `test@example.com`
2. Poczekaj ~30 sekund

**Oczekiwany rezultat**:

- ✅ Email od Supabase: "Reset Your Password"
- ✅ Link w emailu z tokenem
- ✅ Sprawdź folder spam jeśli nie ma

**Debug**:

- Supabase Dashboard → Logs → Email logs (jeśli email nie przyszedł)

---

### ✅ TEST 3: Reset Password (1 min)

1. Kliknij link z emaila
2. Browser otwiera: `/auth/reset-password`
3. Wypełnij:
   - Password: `NewTestPass123!`
   - Confirm: `NewTestPass123!`
4. Obserwuj real-time validation: ✓ Hasło spełnia wymagania
5. Kliknij **"Ustaw nowe hasło"**

**Oczekiwany rezultat**:

- ✅ Button: "Resetowanie..."
- ✅ Success screen: "✅ Hasło zmienione!"
- ✅ "Przekierowanie za 3 sekundy..."
- ✅ Auto-redirect na `/auth/login`

---

### ✅ TEST 4: Login z Nowym Hasłem (30 sek)

1. Na stronie login:
   - Email: `test@example.com`
   - Password: `NewTestPass123!` (nowe!)
2. Kliknij **"Zaloguj się"**

**Oczekiwany rezultat**:

- ✅ Sukces! Redirect na `/generate`
- ✅ UserNav wyświetlony
- ✅ Nowe hasło działa! 🎉

---

## 🔍 Quick Checks

### DevTools Verification (30 sek)

**Po kliknięciu linku z emaila**, sprawdź DevTools (F12):

1. **Application → Cookies**:
   - ✅ `sb-access-token` (z recovery token)

2. **Network Tab** (podczas reset):
   - ✅ POST `/api/auth/reset-password` → 200 OK
   - ✅ Response: `{"message": "Password has been reset successfully"}`

---

## 🧪 Bonus Tests (Opcjonalnie)

### Test Security: Nieistniejący Email

1. /auth/forgot-password
2. Wpisz: `fake@example.com`
3. Submit

**Oczekiwany rezultat**:

- ✅ Success screen (nie ujawnia że email nie istnieje!)
- ✅ Network: 200 OK (security best practice)

---

### Test Expired Token

1. Kliknij stary link reset (> 60 min)
2. Wypełnij formularz
3. Submit

**Oczekiwany rezultat**:

- ✅ Error: "Link resetujący wygasł lub jest nieprawidłowy"
- ✅ HTTP 401 Unauthorized

---

### Test Password Validation

1. Wpisz słabe hasło: `abc`
2. Obserwuj błędy real-time

**Oczekiwany rezultat**:

- ✅ 4 komunikaty błędów:
  - "• Hasło musi mieć co najmniej 8 znaków"
  - "• Hasło musi zawierać wielką literę"
  - "• Hasło musi zawierać cyfrę"
  - "• Hasło musi zawierać znak specjalny"
- ✅ Przycisk disabled

3. Popraw: `NewPass123!`

**Oczekiwany rezultat**:

- ✅ "✓ Hasło spełnia wymagania" (zielony)
- ✅ Przycisk enabled

---

## ✅ Success Criteria

**GOTOWE DO PRODUKCJI** jeśli wszystkie 4 główne testy przechodzą!

- ✅ Forgot password form działa
- ✅ Email przychodzi (check spam)
- ✅ Reset password form działa
- ✅ Login z nowym hasłem działa

---

## 🐛 Common Issues

### Email nie przychodzi?

1. Sprawdź folder spam
2. Supabase Dashboard → Logs → Email logs
3. Sprawdź czy user istnieje w Auth → Users

### Token invalid/expired?

1. Link można użyć tylko raz
2. Token ważny 60 minut
3. Wyślij nowy link z forgot-password

### Password validation errors?

- Sprawdź wszystkie 4 wymagania
- Password i Confirm muszą być identyczne
- Min. 8 znaków, 1 wielka, 1 cyfra, 1 specjalny

---

## 📚 Pełna Dokumentacja

Szczegółowa dokumentacja z 10 testami:
📄 `.ai/auth-password-recovery-implementation.md`

---

**Status**: ✅ Password Recovery System - GOTOWE!
