# Instrukcja: Naprawienie problemu RLS

## Problem
RLS (Row Level Security) było włączone na tabelach, ale wszystkie policies zostały usunięte.
To oznacza że domyślnie **wszystkie operacje są zablokowane** (default deny).

## Rozwiązanie
Całkowicie wyłączyć RLS na tabelach, ponieważ autoryzacja jest obsługiwana na poziomie aplikacji.

## Kroki

### Opcja 1: Przez Supabase CLI (ZALECANE)

```bash
# Jeśli używasz lokalnej instancji Supabase
npx supabase migration up
```

### Opcja 2: Przez Supabase Dashboard

1. Otwórz Supabase Dashboard
2. Przejdź do **SQL Editor**
3. Skopiuj i uruchom poniższy SQL:

```sql
-- Disable RLS on all tables
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;
```

4. Kliknij **Run**

### Opcja 3: Przez Supabase API (PowerShell)

```powershell
# Plik: run-migration.ps1
$supabaseUrl = Read-Host "Podaj Supabase URL"
$serviceRoleKey = Read-Host "Podaj Service Role Key (NIE anon key!)" -AsSecureString
$key = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceRoleKey))

$sql = @"
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;
"@

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Method POST `
        -Headers @{
            "apikey" = $key
            "Authorization" = "Bearer $key"
            "Content-Type" = "application/json"
        } `
        -Body (@{ query = $sql } | ConvertTo-Json)
    
    Write-Host "✓ Migration executed successfully!" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

## Weryfikacja

Po wykonaniu migracji, sprawdź czy RLS jest wyłączone:

```sql
-- Sprawdź status RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('generations', 'flashcards', 'generation_error_logs');
```

Wynik powinien pokazać `rowsecurity = false` dla wszystkich tabel.

## Uwaga o bezpieczeństwie

Po wyłączeniu RLS, **bardzo ważne** jest aby:
1. Zawsze weryfikować `userId` w API endpoints
2. Używać Service Role Key tylko po stronie serwera (nigdy w kliencie!)
3. Sprawdzać ownership zasobów przed każdą operacją

Nasz kod już to robi w `flashcards.service.ts`:
```typescript
.eq('user_id', userId)  // ✓ Sprawdza właściciela
```

## Alternatywa: Użycie Service Role Key

Jeśli nie chcesz wyłączać RLS, możesz użyć Service Role Key:

1. Dodaj do `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. Kod już obsługuje to w `supabase.client.ts` i `middleware/index.ts`

**UWAGA:** Service Role Key **pomija RLS całkowicie**, więc musisz być bardzo ostrożny!

