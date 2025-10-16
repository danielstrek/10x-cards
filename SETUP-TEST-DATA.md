# Przygotowanie danych testowych do testowania endpointa

## Krok 1: Uruchom Supabase lokalnie (jeśli używasz lokalnej instancji)

```bash
# Jeśli masz Supabase CLI
npx supabase start
```

## Krok 2: Utwórz użytkownika testowego

### Opcja A: Przez Supabase Dashboard

1. Otwórz Supabase Dashboard (lokalnie lub w chmurze)
2. Przejdź do **Authentication** → **Users**
3. Kliknij **Add user** → **Create new user**
4. Wypełnij:
   - Email: `test@example.com`
   - Password: `Test123456!`
   - Auto Confirm User: ✓ (zaznacz)
5. Kliknij **Create user**
6. **Zapisz** wyświetlony `User UID` - to będzie Twój `user_id`

### Opcja B: Przez SQL (szybsza)

```sql
-- W Supabase SQL Editor
-- UWAGA: To działa tylko lokalnie, w produkcji użyj Dashboard lub Auth API

-- Najpierw sprawdź czy nie ma już użytkownika
SELECT id, email FROM auth.users WHERE email = 'test@example.com';

-- Jeśli nie ma, możesz spróbować przez auth.signup
-- Ale zazwyczaj łatwiej przez Dashboard
```

### Opcja C: Przez Supabase Auth API (programowo)

```bash
# Przykład z curl
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/signup' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

## Krok 3: Uzyskaj Access Token

### Opcja A: Przez zalogowanie (Auth API)

```bash
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

Zapisz `access_token` z odpowiedzi.

### Opcja B: PowerShell helper script

```powershell
# login.ps1
$supabaseUrl = "YOUR_SUPABASE_URL"  # np. "http://localhost:54321"
$anonKey = "YOUR_ANON_KEY"

$body = @{
    email = "test@example.com"
    password = "Test123456!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{
        "apikey" = $anonKey
        "Content-Type" = "application/json"
    } `
    -Body $body

Write-Host "Access Token:" -ForegroundColor Green
$response.access_token
Write-Host "`nUser ID:" -ForegroundColor Green
$response.user.id

# Zapisz do zmiennych
$env:TEST_TOKEN = $response.access_token
$env:TEST_USER_ID = $response.user.id

Write-Host "`nZmienne środowiskowe ustawione:" -ForegroundColor Yellow
Write-Host "  `$env:TEST_TOKEN"
Write-Host "  `$env:TEST_USER_ID"
```

## Krok 4: Utwórz testową generację

### Przez SQL Editor w Supabase Dashboard

```sql
-- Zamień 'YOUR_USER_ID' na prawdziwy user_id z Kroku 2
INSERT INTO generations (
  user_id,
  model,
  source_text_hash,
  source_text_length,
  generated_count,
  generation_duration,
  accepted_unedited_count,
  accepted_edited_count
) VALUES (
  'YOUR_USER_ID',  -- ⚠️ ZAMIEŃ NA PRAWDZIWY USER_ID
  'gpt-4',
  'test-hash-' || gen_random_uuid()::text,
  1500,
  10,
  2500,
  0,
  0
) RETURNING id, user_id, model, created_at;
```

**Zapisz zwrócone `id`** - to będzie Twój `generationId` w testach!

### Przykład z wieloma generacjami

```sql
-- Utwórz 3 testowe generacje
INSERT INTO generations (user_id, model, source_text_hash, source_text_length, generated_count, generation_duration)
VALUES 
  ('YOUR_USER_ID', 'gpt-4', 'hash-1', 1000, 5, 1000),
  ('YOUR_USER_ID', 'gpt-3.5-turbo', 'hash-2', 2000, 8, 1500),
  ('YOUR_USER_ID', 'claude-3', 'hash-3', 1500, 6, 1200)
RETURNING id, model;
```

## Krok 5: Zapisz dane testowe

Utwórz plik `test-config.ps1`:

```powershell
# test-config.ps1
# Dane testowe - UZUPEŁNIJ!

$env:SUPABASE_URL = "http://localhost:54321"  # lub URL Twojego Supabase
$env:SUPABASE_ANON_KEY = "your-anon-key-here"

# Z Kroku 3
$env:TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Twój access token
$env:TEST_USER_ID = "uuid-here"  # UUID użytkownika

# Z Kroku 4
$env:TEST_GENERATION_ID = "1"  # ID utworzonej generacji

Write-Host "✓ Zmienne testowe załadowane:" -ForegroundColor Green
Write-Host "  Token: $($env:TEST_TOKEN.Substring(0,20))..."
Write-Host "  User ID: $env:TEST_USER_ID"
Write-Host "  Generation ID: $env:TEST_GENERATION_ID"
```

Użyj w testach:

```powershell
# Załaduj konfigurację
. .\test-config.ps1

# Uruchom testy
.\test-quick.ps1
# Gdy poprosi o token, wklej: $env:TEST_TOKEN
# Gdy poprosi o generationId, wpisz: $env:TEST_GENERATION_ID
```

## Krok 6: Sprawdź dane w bazie

```sql
-- Sprawdź użytkownika
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test@example.com';

-- Sprawdź generacje
SELECT id, user_id, model, generated_count, created_at
FROM generations
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Sprawdź flashcards (jeśli już jakieś utworzyłeś)
SELECT id, front, back, source, generation_id, created_at
FROM flashcards
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

## Szybki Setup - All-in-One Script

```powershell
# quick-setup.ps1
Write-Host "=== Quick Setup dla testowania /api/flashcards ===" -ForegroundColor Cyan

# 1. Konfiguracja
$supabaseUrl = Read-Host "Podaj Supabase URL (np. http://localhost:54321)"
$anonKey = Read-Host "Podaj Supabase Anon Key"
$email = Read-Host "Email testowego użytkownika (lub Enter dla test@example.com)"
if ([string]::IsNullOrWhiteSpace($email)) { $email = "test@example.com" }
$password = Read-Host "Hasło (lub Enter dla Test123456!)" -AsSecureString
if ($password.Length -eq 0) { $password = ConvertTo-SecureString "Test123456!" -AsPlainText -Force }

# 2. Zaloguj się (lub zarejestruj)
Write-Host "`nLogowanie..." -ForegroundColor Yellow
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$loginBody = @{ email = $email; password = $plainPassword } | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
        -Method POST `
        -Headers @{ "apikey" = $anonKey; "Content-Type" = "application/json" } `
        -Body $loginBody
    
    Write-Host "✓ Zalogowano pomyślnie!" -ForegroundColor Green
    $token = $authResponse.access_token
    $userId = $authResponse.user.id
} catch {
    Write-Host "✗ Błąd logowania. Spróbuj utworzyć użytkownika w Dashboard." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# 3. Wyświetl dane
Write-Host "`n=== Dane testowe ===" -ForegroundColor Cyan
Write-Host "User ID: $userId"
Write-Host "Token (pierwsze 50 znaków): $($token.Substring(0, [Math]::Min(50, $token.Length)))..."

# 4. Zapisz do pliku
$config = @"
# Test Configuration - Wygenerowano $(Get-Date)
`$env:SUPABASE_URL = "$supabaseUrl"
`$env:SUPABASE_ANON_KEY = "$anonKey"
`$env:TEST_TOKEN = "$token"
`$env:TEST_USER_ID = "$userId"
# `$env:TEST_GENERATION_ID = "1"  # Uzupełnij po utworzeniu generacji w bazie

Write-Host "✓ Konfiguracja załadowana" -ForegroundColor Green
"@

$config | Out-File -FilePath "test-config.ps1" -Encoding UTF8
Write-Host "`n✓ Zapisano do test-config.ps1" -ForegroundColor Green

Write-Host "`nKolejne kroki:" -ForegroundColor Yellow
Write-Host "1. Otwórz Supabase Dashboard → SQL Editor"
Write-Host "2. Wykonaj SQL do utworzenia generacji (patrz SETUP-TEST-DATA.md)"
Write-Host "3. Skopiuj zwrócone 'id' i wklej do test-config.ps1"
Write-Host "4. Uruchom: . .\test-config.ps1"
Write-Host "5. Uruchom: .\test-quick.ps1`n"
```

## Czyszczenie danych testowych

```sql
-- Usuń wszystkie testowe flashcards
DELETE FROM flashcards WHERE user_id = 'YOUR_USER_ID';

-- Usuń testowe generacje
DELETE FROM generations WHERE user_id = 'YOUR_USER_ID';

-- Resetuj liczniki w istniejącej generacji
UPDATE generations 
SET accepted_unedited_count = 0, accepted_edited_count = 0
WHERE id = YOUR_GENERATION_ID;
```

---

**Gotowe! Teraz możesz testować endpoint! 🚀**

