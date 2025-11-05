# 🚀 Quick Test - Priorytet 1 (Pełny System Auth)

## Szybki Test w 5 Minut

### Krok 1: Konfiguracja Supabase (2 min)

1. **Otwórz Supabase Dashboard**
2. **Authentication → Providers → Email**:
   - ✅ Enable Email provider
3. **Authentication → Settings**:
   - "Confirm email" → **DISABLE** ⚠️ (dla MVP - łatwiejsze testowanie)
   - Zapisz zmiany

### Krok 2: Uruchom Serwer (30 sek)

```bash
npm run dev
```

Otwórz: http://localhost:3000

---

## Test Flow (3 min)

### ✅ Test 1: Strona Główna (10 sek)

1. Otwórz http://localhost:3000
2. **Oczekuj**: Welcome page z 2 przyciskami:
   - "Zaloguj się"
   - "Zarejestruj się"

---

### ✅ Test 2: Rejestracja (30 sek)

1. Kliknij **"Zarejestruj się"**
2. Wypełnij:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - Confirm: `TestPass123!`
3. Obserwuj real-time validation:
   - ✓ Hasło spełnia wymagania
   - ✓ Hasła są identyczne
4. Kliknij **"Zarejestruj się"**

**Oczekiwany rezultat**:

- ✅ Przycisk: "Rejestracja..." ze spinnerem
- ✅ Po 1-2 sek → przekierowanie na `/generate`
- ✅ UserNav na górze z:
  - Avatar "TE" (test)
  - Email: test@example.com
  - Przycisk "Wyloguj"

---

### ✅ Test 3: Ochrona Strony (10 sek)

1. W UserNav kliknij **"Wyloguj"**
2. **Oczekuj**:
   - Przycisk "Wylogowywanie..."
   - Redirect na `/auth/login`
3. Wpisz w URL: http://localhost:3000/generate
4. **Oczekuj**: Automatyczny redirect na `/auth/login?redirect=/generate`

---

### ✅ Test 4: Logowanie (20 sek)

1. Na stronie login wypełnij:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - ✅ Zaznacz "Zapamiętaj mnie"
2. Kliknij **"Zaloguj się"**

**Oczekiwany rezultat**:

- ✅ Redirect na `/generate` (z parametru redirect)
- ✅ UserNav wyświetlony
- ✅ Wszystko działa!

---

### ✅ Test 5: Auto-Redirect (20 sek)

1. Będąc zalogowanym, wejdź na: http://localhost:3000
2. **Oczekuj**: Natychmiastowy redirect na `/generate`

3. Wejdź na: http://localhost:3000/auth/login
4. **Oczekuj**: Natychmiastowy redirect na `/generate`

5. Wejdź na: http://localhost:3000/auth/register
6. **Oczekuj**: Natychmiastowy redirect na `/generate`

---

### ✅ Test 6: Wylogowanie (10 sek)

1. Kliknij **"Wyloguj"** w UserNav
2. **Oczekuj**: Redirect na `/auth/login`
3. Próbuj wejść na `/generate`
4. **Oczekuj**: Redirect na `/auth/login?redirect=/generate`

---

## ✅ Quick Checks

### DevTools Verification (30 sek)

**Po zalogowaniu**, otwórz DevTools (F12):

1. **Application → Cookies** (localhost:3000):
   - ✅ `sb-access-token` (httpOnly)
   - ✅ `sb-refresh-token` (httpOnly)

2. **Application → Local Storage** (jeśli zaznaczyłeś "Zapamiętaj"):
   - ✅ `sb-access-token`
   - ✅ `sb-refresh-token`

3. **Network Tab** (podczas logowania):
   - ✅ POST `/api/auth/login` → 200 OK
   - ✅ Response body z tokenami i user

**Po wylogowaniu**:

- ✅ Brak cookies `sb-*`
- ✅ Brak tokenów w storage

---

## 🎯 Expected Results Summary

Po ukończeniu wszystkich testów:

✅ Rejestracja działa (auto-login)  
✅ Logowanie działa (z redirect param)  
✅ Wylogowanie działa (clear cookies + storage)  
✅ Ochrona /generate działa  
✅ Auto-redirect dla zalogowanych działa  
✅ UserNav wyświetla user info  
✅ Cookies ustawione poprawnie (httpOnly, secure, sameSite)  
✅ Real-time validation w formularzach

---

## 🐛 Common Issues

### Problem: "Invalid JSON" podczas rejestracji

**Fix**: Sprawdź czy Content-Type: application/json w request

### Problem: Redirect loop (ciągłe przekierowania)

**Fix**: Wyczyść cookies i localStorage, zrestartuj przeglądarkę

### Problem: "SUPABASE_URL is not defined"

**Fix**: Sprawdź `.env`, zrestartuj dev server

### Problem: "Email already registered"

**Fix**: To normalne - użyj innego email lub usuń user w Supabase Dashboard

### Problem: UserNav nie wyświetla się

**Fix**: Sprawdź czy `Astro.locals.user` jest ustawiony (console.log w generate.astro)

---

## 📊 Supabase Dashboard Verification

Po testach, sprawdź w Supabase:

1. **Authentication → Users**:
   - ✅ User `test@example.com` istnieje
   - ✅ Last Sign In timestamp aktualny

2. **Authentication → Logs** (opcjonalnie):
   - ✅ Zdarzenia logowania/rejestracji

---

## ✅ Success Criteria

**GOTOWE DO PRODUKCJI** jeśli wszystkie 6 testów przechodzą bez błędów!

---

## 📚 Dla Szczegółów

Pełna dokumentacja: `.ai/auth-priority1-implementation-summary.md`

Szczegółowe testy: Sekcja "Instrukcja Testowania Pełnego Flow"
