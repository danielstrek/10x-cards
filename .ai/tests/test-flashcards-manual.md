# Manual Testing Guide - POST /api/flashcards

## Przygotowanie

### 1. Sprawdź czy serwer działa

Serwer powinien być uruchomiony na: `http://localhost:4321`

### 2. Uzyskaj token autoryzacji

**Opcja A: Jeśli masz już użytkownika w Supabase**

```bash
# Zaloguj się przez Supabase Auth i uzyskaj access token
# (możesz to zrobić przez frontend lub bezpośrednio przez Supabase API)
```

**Opcja B: Utwórz nowego użytkownika (gdy będzie endpoint /api/auth/register)**

```bash
# Najpierw potrzebny będzie endpoint rejestracji
```

**Tymczasowe rozwiązanie - przez Supabase Dashboard:**

1. Otwórz Supabase Dashboard
2. Przejdź do Authentication > Users
3. Utwórz użytkownika lub skopiuj istniejący `user_id`
4. Użyj Supabase CLI lub Dashboard do wygenerowania tokena

### 3. Utwórz testową generację

Najpierw musisz mieć record w tabeli `generations`. Możesz go utworzyć przez Supabase Dashboard:

```sql
-- Wykonaj w Supabase SQL Editor
INSERT INTO generations (
  user_id,
  model,
  source_text_hash,
  source_text_length,
  generated_count,
  generation_duration
) VALUES (
  'TWOJ_USER_ID',  -- Zamień na prawdziwy user_id
  'gpt-4',
  'test-hash-123',
  1000,
  5,
  1500
) RETURNING id;
```

Zapisz zwrócone `id` - to będzie Twój `generationId`.

---

## Testy manualne

### ✅ Test 1: Success - Utworzenie flashcards

```powershell
# PowerShell (Windows)
$token = "TWOJ_ACCESS_TOKEN"  # Zamień na prawdziwy token
$generationId = 1  # Zamień na prawdziwy ID generacji

$body = @{
    generationId = $generationId
    flashcards = @(
        @{
            front = "What is TypeScript?"
            back = "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript."
            source = "ai-full"
        },
        @{
            front = "What is Astro?"
            back = "Astro is a modern web framework for building fast, content-focused websites."
            source = "ai-edited"
        },
        @{
            front = "What is Supabase?"
            back = "Supabase is an open-source Firebase alternative providing backend services."
            source = "manual"
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body | Select-Object StatusCode, Content
```

**Oczekiwany wynik:**

- Status Code: `201`
- Response zawiera `created` array z 3 flashcards
- Każdy flashcard ma `id`, `front`, `back`

---

### ❌ Test 2: Validation Error - Puste pole front

```powershell
$body = @{
    generationId = $generationId
    flashcards = @(
        @{
            front = ""  # Puste!
            back = "Some answer"
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body
} catch {
    $_.Exception.Response.StatusCode.value__
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.ReadToEnd()
}
```

**Oczekiwany wynik:**

- Status Code: `400`
- Error message o walidacji

---

### ❌ Test 3: Validation Error - Front za długie (>200 chars)

```powershell
$longText = "A" * 250  # 250 znaków

$body = @{
    generationId = $generationId
    flashcards = @(
        @{
            front = $longText
            back = "Answer"
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body
} catch {
    $_.Exception.Response.StatusCode.value__
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.ReadToEnd() | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
```

**Oczekiwany wynik:**

- Status Code: `400`
- Details zawierają informację o "200 characters"

---

### ❌ Test 4: Validation Error - Pusta tablica flashcards

```powershell
$body = @{
    generationId = $generationId
    flashcards = @()  # Pusta tablica
} | ConvertTo-Json -Depth 10

try {
    Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body
} catch {
    $_.Exception.Response.StatusCode.value__
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.ReadToEnd() | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
```

**Oczekiwany wynik:**

- Status Code: `400`
- Message o wymaganym minimum 1 flashcard

---

### ❌ Test 5: Auth Error - Brak tokena

```powershell
$body = @{
    generationId = $generationId
    flashcards = @(
        @{
            front = "Question"
            back = "Answer"
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body $body
} catch {
    $_.Exception.Response.StatusCode.value__
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.ReadToEnd()
}
```

**Oczekiwany wynik:**

- Status Code: `401`
- Error: "Unauthorized"

---

### ❌ Test 6: Auth Error - Nieprawidłowy token

```powershell
$body = @{
    generationId = $generationId
    flashcards = @(
        @{
            front = "Question"
            back = "Answer"
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer invalid-token-12345"
            "Content-Type" = "application/json"
        } `
        -Body $body
} catch {
    $_.Exception.Response.StatusCode.value__
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.ReadToEnd()
}
```

**Oczekiwany wynik:**

- Status Code: `401`
- Message o nieprawidłowym tokenie

---

### ❌ Test 7: Not Found - Nieistniejąca generacja

```powershell
$body = @{
    generationId = 999999  # Nie istnieje
    flashcards = @(
        @{
            front = "Question"
            back = "Answer"
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body
} catch {
    $_.Exception.Response.StatusCode.value__
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.ReadToEnd()
}
```

**Oczekiwany wynik:**

- Status Code: `404`
- Message o nieznalezionej generacji

---

### ✅ Test 8: Edge Case - Maksymalna długość stringów

```powershell
$maxFront = "Q" * 200  # Dokładnie 200 znaków
$maxBack = "A" * 500   # Dokładnie 500 znaków

$body = @{
    generationId = $generationId
    flashcards = @(
        @{
            front = $maxFront
            back = $maxBack
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body | Select-Object StatusCode, Content
```

**Oczekiwany wynik:**

- Status Code: `201`
- Flashcards utworzone pomyślnie

---

### ✅ Test 9: Edge Case - 100 flashcards (max)

```powershell
$flashcards = @()
for ($i = 1; $i -le 100; $i++) {
    $flashcards += @{
        front = "Question $i"
        back = "Answer $i"
        source = "ai-full"
    }
}

$body = @{
    generationId = $generationId
    flashcards = $flashcards
} | ConvertTo-Json -Depth 10

$response = Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body

$response.StatusCode
($response.Content | ConvertFrom-Json).created.Count
```

**Oczekiwany wynik:**

- Status Code: `201`
- created.Count: `100`

---

### ❌ Test 10: Edge Case - 101 flashcards (over limit)

```powershell
$flashcards = @()
for ($i = 1; $i -le 101; $i++) {
    $flashcards += @{
        front = "Q$i"
        back = "A$i"
        source = "ai-full"
    }
}

$body = @{
    generationId = $generationId
    flashcards = $flashcards
} | ConvertTo-Json -Depth 10

try {
    Invoke-WebRequest -Uri "http://localhost:4321/api/flashcards" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body
} catch {
    $_.Exception.Response.StatusCode.value__
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.ReadToEnd() | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
```

**Oczekiwany wynik:**

- Status Code: `400`
- Message o maksymalnym limicie 100

---

## Weryfikacja w bazie danych

Po udanych testach, możesz zweryfikować dane w Supabase:

```sql
-- Sprawdź utworzone flashcards
SELECT * FROM flashcards
WHERE generation_id = TWOJ_GENERATION_ID
ORDER BY created_at DESC;

-- Sprawdź zaktualizowane liczniki w generacji
SELECT
  id,
  generated_count,
  accepted_unedited_count,
  accepted_edited_count
FROM generations
WHERE id = TWOJ_GENERATION_ID;
```

**Oczekiwane:**

- `accepted_unedited_count` - liczba flashcards ze source='ai-full'
- `accepted_edited_count` - liczba flashcards ze source='ai-edited'

---

## Szybkie testy (kopiuj-wklej)

### Ustaw zmienne na początku sesji:

```powershell
# ZAMIEŃ te wartości na prawdziwe!
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$generationId = 1
$apiUrl = "http://localhost:4321/api/flashcards"
```

### Quick Success Test:

```powershell
$body = '{"generationId":' + $generationId + ',"flashcards":[{"front":"Test Q","back":"Test A","source":"ai-full"}]}'
Invoke-WebRequest -Uri $apiUrl -Method POST -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} -Body $body
```

---

**Powodzenia w testowaniu! 🚀**
