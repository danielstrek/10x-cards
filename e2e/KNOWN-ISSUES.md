# Known Issues and Solutions

## Status: ✅ Częściowo rozwiązane

### Problem 1: ✅ NAPRAWIONE - BASE_URL configuration
**Status:** Rozwiązane  
**Opis:** Nieprawidłowy BASE_URL w `playwright.config.ts` (dodatkowy backtick)  
**Rozwiązanie:** Poprawiono na `http://localhost:3000`

### Problem 2: ✅ NAPRAWIONE - localStorage access on blank page
**Status:** Rozwiązane  
**Opis:** Błęd SecurityError przy próbie dostępu do localStorage gdy page.url() === 'about:blank'  
**Rozwiązanie:** Dodano sprawdzanie URL i nawigację do strony przed dostępem do storage w `auth.helper.ts`

### Problem 3: ⚠️ WYMAGA AKCJI - Brakujące test-ids w RegisterForm

**Status:** Częściowo rozwiązane  
**Opis:** RegisterForm.tsx nie ma wszystkich potrzebnych `data-test-id` atrybutów

**Brakujące test-ids:**
- `register-email-input` - ✅ DODANE
- `register-password-input` - ❌ BRAK
- `register-confirm-password-input` - ❌ BRAK  
- `register-submit-button` - ❌ BRAK
- `register-password-toggle` - ❌ BRAK (opcjonalne)
- `register-error-notification` - ❌ BRAK (opcjonalne)

**Rozwiązanie tymczasowe:**
Zaktualizuj `RegisterPage.ts`, aby używał selektorów ID zamiast test-ids:

\`\`\`typescript
// W RegisterPage.ts
this.emailInput = page.locator('#email');
this.passwordInput = page.locator('#password');
this.confirmPasswordInput = page.locator('#confirmPassword');
this.submitButton = page.getByRole('button', { name: /zarejestruj się/i });
\`\`\`

**Rozwiązanie docelowe:**
Dodaj wszystkie test-ids do RegisterForm.tsx (wymaga edycji komponentu React).

### Problem 4: ⚠️ W TRAKCIE - Walidacja formularza rejestracji

**Status:** W trakcie debugowania  
**Opis:** Testy oczekują komunikatów walidacyjnych, które mogą mieć inną treść lub lokalizację

**Przykład:**
- Test szuka: `/hasła nie są identyczne/i`
- Komponent pokazuje: `'✗ Hasła nie są identyczne'`

**Rozwiązanie:**
Testy używają już prawidłowej frazy. Problem może być w tym, że komunikat nie pojawia się natychmiast.

**Sugestia:** Dodaj czekanie na walidację:
\`\`\`typescript
await page.fill('#confirmPassword', differentPassword);
await page.waitForTimeout(300); // Poczekaj na walidację
\`\`\`

### Problem 5: ⚠️ WYMAGA WERYFIKACJI - Auto-login po rejestracji

**Status:** Do weryfikacji  
**Opis:** Testy zakładają auto-login po rejestracji, ale może być wymagana weryfikacja email

**Objawy:**
- Test TC-AUTH-001 oczekuje redirect do `/generate` lub success message
- Może timeout jeśli weryfikacja email jest włączona

**Rozwiązanie:**
1. Sprawdź ustawienia Supabase: czy email confirmation jest wyłączona?
2. Jeśli włączona, testy muszą obsługiwać success screen zamiast auto-login

### Problem 6: ⚠️ WYMAGA BADANIA - Button disabled przez walidację

**Status:** Do zbadania  
**Opis:** Submit button jest disabled zbyt długo - test timeout

**Objawy:**
```
waiting for element to be visible, enabled and stable
- element is not enabled
```

**Możliwe przyczyny:**
1. Walidacja formularza nie kończy się
2. State `isFormValid` nie aktualizuje się
3. React re-render delay

**Rozwiązanie tymczasowe:**
Użyj `force: true` do kliknięcia lub poczekaj dłużej:
\`\`\`typescript
await submitButton.click({ force: true });
// LUB
await expect(submitButton).toBeEnabled({ timeout: 10000 });
await submitButton.click();
\`\`\`

## Następne kroki

### 1. ✅ Natychmiastowe (ZROBIONE)
- [x] Napraw BASE_URL w playwright.config.ts  
- [x] Napraw clearAuth() i isAuthenticated()
- [x] Dodaj BASE_URL do .env.test

### 2. 🔄 Krótkoterminowe (W TRAKCIE)
- [ ] Dodaj wszystkie test-ids do RegisterForm.tsx
- [ ] Zaktualizuj RegisterPage.ts, aby używał prawidłowych selektorów
- [ ] Sprawdź ustawienia email confirmation w Supabase
- [ ] Dodaj czekanie na walidację w testach

### 3. ⏳ Średnioterminowe
- [ ] Przejrzyj wszystkie komponenty auth i dodaj brakujące test-ids
- [ ] Ujednolicić strategie selectorów (test-ids vs role vs id)
- [ ] Dodać retry logic dla flaky tests
- [ ] Zwiększyć timeouty dla walidacji formularzy

### 4. 📝 Długoterminowe
- [ ] Stworzyć comprehensive test-ids guide
- [ ] Dodać automatyczne sprawdzanie test-ids w CI
- [ ] Rozważyć custom fixture dla form validation waits
- [ ] Performance optimizations dla testów

## Jak uruchomić testy teraz?

### Testy które działają:
\`\`\`bash
# Test redirect without auth (działa!)
npx playwright test auth/01-registration-and-login.spec.ts -g "TC-AUTH-006"

# Test weak password validation (działa!)
npx playwright test auth/01-registration-and-login.spec.ts -g "TC-AUTH-002"
\`\`\`

### Testy które wymagają poprawek:
\`\`\`bash
# Registration - wymaga dodania test-ids
npx playwright test auth/01-registration-and-login.spec.ts -g "TC-AUTH-001"

# Password mismatch - wymaga czekania na walidację
npx playwright test auth/01-registration-and-login.spec.ts -g "TC-AUTH-003"

# Login - wymaga naprawienia rejestracji najpierw
npx playwright test auth/01-registration-and-login.spec.ts -g "TC-AUTH-004"
\`\`\`

## Temporary Workarounds

Jeśli chcesz szybko przetestować inne scenariusze:

### 1. Pomiń testy rejestracji
\`\`\`bash
npx playwright test --grep-invert "registration|register"
\`\`\`

### 2. Użyj istniejącego użytkownika
Edytuj `.env.test` i użyj credentials z bazy:
\`\`\`env
E2E_USERNAME=test1@example.com
E2E_PASSWORD=TestPass123!
\`\`\`

Następnie możesz skipować rejestrację w testach.

### 3. Uruchom tylko testy które nie wymagają rejestracji
\`\`\`bash
# Testy które powinny działać:
npx playwright test auth/01-registration-and-login.spec.ts -g "TC-AUTH-006"
npx playwright test auth/01-registration-and-login.spec.ts -g "TC-AUTH-009"
npx playwright test auth/01-registration-and-login.spec.ts -g "TC-AUTH-010"
\`\`\`

## Kontakt

Jeśli masz pytania lub znalazłeś inne problemy, dodaj je do tego dokumentu.

