# Rozwiązanie problemu: Generation null (404 Error)

## 🔴 Problem
Przy testowaniu endpointa `/api/flashcards` otrzymywałeś błąd 404:
```json
{
    "error": "Not Found",
    "message": "Generation not found or does not belong to user"
}
```

W debugowaniu widać było że `generation = null`.

## 🔍 Diagnoza

### Główna przyczyna:
**Row Level Security (RLS) był włączony, ale wszystkie policies zostały usunięte**

W Supabase działa to tak:
1. ✅ RLS włączone (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
2. ❌ Brak policies (DROP POLICY ...)
3. 💥 Rezultat: **default DENY** - wszystkie zapytania zwracają NULL/pusty wynik

### Dlaczego to się stało:
- Migracja `20251013184400_create_generations_table.sql` **utworzyła policies**
- Migracja `20251013184800_disable_rls_policies.sql` **usunęła policies**
- Ale **nie wyłączyła RLS**!

To jak mieć zabezpieczenia na drzwiach, ale usunąć wszystkie klucze - nikt nie może wejść.

### Dodatkowe problemy w kodzie:
```typescript
// src/lib/services/flashcards.service.ts (linia 33)
.eq('user_id', '18176f3b-c1b9-478e-a34f-75fe57bc8566')  // ❌ Zahardcodowane!
```

## ✅ Rozwiązanie

### Zmiany w kodzie:

#### 1. **supabase.client.ts** - Dodano Service Client
```typescript
// Klient z Service Role Key - pomija RLS
export const supabaseServiceClient = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseClient; // Fallback do anon key
```

#### 2. **middleware/index.ts** - Używaj Service Client
```typescript
import { supabaseServiceClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseServiceClient;  // ✅ Service client
  return next();
});
```

#### 3. **flashcards.service.ts** - Usuń debug i hardcoded user_id
```typescript
// ✅ PRZED:
//.eq('user_id', userId)
.eq('user_id', '18176f3b-c1b9-478e-a34f-75fe57bc8566')
console.log("dto.generationId: ", dto.generationId);
console.log("generation: ", generation);
console.log("userId: ", userId);

// ✅ PO:
.eq('user_id', userId)  // Prawidłowa walidacja!
```

### Migracja bazy danych:

Uruchom SQL w Supabase Dashboard → SQL Editor:

```sql
-- Całkowicie wyłącz RLS (bo i tak policies były usunięte)
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;
```

Lub użyj Supabase CLI:
```bash
npx supabase migration up
```

## 🔐 Uwaga o bezpieczeństwie

Po wyłączeniu RLS, autoryzacja **MUSI** być obsługiwana w aplikacji:

### ✅ Dobrze (tak mamy w kodzie):
```typescript
// 1. Weryfikacja tokena
const { data: { user }, error } = await supabase.auth.getUser(token);

// 2. Sprawdzenie ownership
.eq('user_id', userId)
```

### ❌ Źle (nie róbmy tego):
```typescript
// Brak sprawdzenia userId - każdy może edytować wszystko!
.eq('id', dto.generationId)  // ❌ Tylko ID, bez user_id
```

## 🧪 Testowanie

### Krok 1: Ustaw zmienne środowiskowe
Jeśli używasz Service Role Key (opcjonalne):

```env
# .env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**UWAGA:** NIE commituj Service Role Key do repo!

### Krok 2: Utwórz dane testowe

```sql
-- Sprawdź swój user_id
SELECT id, email FROM auth.users WHERE email = 'test@example.com';

-- Utwórz generację dla tego użytkownika
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
  'YOUR_USER_ID_HERE',  -- ⚠️ Zmień na prawdziwy user_id
  'gpt-4',
  'test-hash-' || gen_random_uuid()::text,
  1500,
  10,
  2500,
  0,
  0
) RETURNING id;
```

### Krok 3: Uruchom testy
```powershell
cd .ai/tests
.\test-quick.ps1
```

## 📋 Checklist

- [x] ~~Zahardcodowany user_id~~ → Naprawiono
- [x] ~~Debug console.log~~ → Usunięto
- [x] ~~RLS włączone bez policies~~ → RLS wyłączone lub używamy Service Key
- [x] ~~Middleware używa anon key~~ → Używa service client
- [ ] **Wykonaj migrację SQL** (wyłącz RLS)
- [ ] **Utwórz dane testowe** (generation dla swojego user_id)
- [ ] **Przetestuj endpoint**

## 🚀 Gotowe!

Po wykonaniu powyższych kroków, endpoint `/api/flashcards` powinien działać poprawnie!

### Jeśli nadal nie działa:

1. **Sprawdź logi serwera** - uruchom dev server z flagą verbose
2. **Sprawdź token** - czy jest prawidłowy i nie wygasł?
3. **Sprawdź user_id** - czy generation należy do tego użytkownika?
4. **Uruchom diagnozę**: `.\diagnose-db.ps1`

