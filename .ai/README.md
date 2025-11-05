# 10x-cards - Documentation Index

Katalog `.ai` zawiera całą dokumentację projektową, plany implementacji oraz szczegółowe opisy endpointów API.

## 🚀 Quick Start - Test Flashcards Endpoint

### Windows (PowerShell)

```powershell
# Uruchom serwer dev
npm run dev

# W nowym terminalu - uruchom testy
.\.ai\test-flashcards-endpoint.ps1 -Token "YOUR_ACCESS_TOKEN" -GenerationId 123
```

### Linux/macOS (Bash)

```bash
# Uruchom serwer dev
npm run dev

# W nowym terminalu - uruchom testy
chmod +x .ai/test-flashcards-endpoint.sh
./.ai/test-flashcards-endpoint.sh "YOUR_ACCESS_TOKEN" 123
```

### Manual Testing (cURL)

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"generationId":123,"flashcards":[{"front":"Q","back":"A","source":"ai-full"}]}'
```

---

## 📋 Dokumenty projektowe

### Planowanie i architektura

- **[prd.md](prd.md)** - Product Requirements Document
- **[tech-stach.md](tech-stach.md)** - Stack technologiczny projektu
- **[db-plan.md](db-plan.md)** - Schemat bazy danych i migracje
- **[api-plan.md](api-plan.md)** - Kompletny plan wszystkich endpointów REST API

## 🚀 Implementacje endpointów

### POST /api/flashcards (✅ ZAIMPLEMENTOWANY)

Endpoint do masowego tworzenia flashcards z propozycji AI.

#### Dokumentacja

1. **[flashcards-implementation-summary.md](flashcards-implementation-summary.md)** - START HERE!
   - Podsumowanie całej implementacji
   - Status wszystkich kroków
   - Quick start guide
   - Co zostało zrobione i co dalej

2. **[flashcards-endpoint-documentation.md](flashcards-endpoint-documentation.md)** - Kompletna dokumentacja
   - Szczegóły endpointa (request/response)
   - Business logic flow
   - Security considerations
   - Database schema
   - Error handling
   - Performance optimization
   - Manual testing scenarios

3. **[flashcards-endpoint-examples.md](flashcards-endpoint-examples.md)** - Przykłady użycia
   - JavaScript/TypeScript examples
   - React hooks
   - cURL commands
   - HTTPie, Postman
   - Edge cases & best practices
   - Error handling patterns

4. **[flashcards-endpoint-tests.md](flashcards-endpoint-tests.md)** - Scenariusze testowe
   - Unit tests (Zod validation)
   - Service layer tests
   - Integration tests
   - Manual testing checklist

5. **Test Scripts** - Automatyczne testy endpointa
   - **[test-flashcards-endpoint.sh](test-flashcards-endpoint.sh)** - Bash script (Linux/macOS)
   - **[test-flashcards-endpoint.ps1](test-flashcards-endpoint.ps1)** - PowerShell script (Windows)
   - Testują wszystkie główne scenariusze (success, validation, auth, not found)

#### Plany implementacji

- **[generations-endpoint-implementation-plan.md](generations-endpoint-implementation-plan.md)** - Plan wdrożenia
  > ⚠️ **Uwaga**: Nazwa pliku jest myląca (legacy naming). Plik zawiera plan dla endpointa `/api/flashcards`, NIE `/api/generations`.

#### Zaimplementowane pliki kodu

```
src/
├── lib/
│   └── services/
│       └── flashcards.service.ts   ✅ Service layer
├── pages/
│   └── api/
│       └── flashcards.ts           ✅ API endpoint
├── db/
│   └── supabase.client.ts          ✅ Updated (SupabaseClient export)
└── env.d.ts                        ✅ Updated (using custom type)
```

## 📖 Jak czytać dokumentację

### Dla developerów implementujących nowe endpointy

1. Przeczytaj `api-plan.md` - znajdź swój endpoint
2. Stwórz plan implementacji (wzoruj się na `generations-endpoint-implementation-plan.md`)
3. Implementuj endpoint (użyj `flashcards.service.ts` i `flashcards.ts` jako referencji)
4. Dokumentuj (wzoruj się na dokumentacji flashcards)

### Dla developerów używających API

1. Zacznij od `flashcards-implementation-summary.md`
2. Zobacz `flashcards-endpoint-examples.md` dla przykładów kodu
3. Sprawdź `flashcards-endpoint-documentation.md` dla szczegółów

### Dla QA/Testerów

1. `flashcards-endpoint-documentation.md` - zrozum endpoint
2. `flashcards-endpoint-tests.md` - scenariusze testowe
3. `flashcards-endpoint-examples.md` - przykłady do manual testingu

## 🎯 Status implementacji endpointów

| Endpoint               | Metoda   | Status      | Dokumentacja                                    |
| ---------------------- | -------- | ----------- | ----------------------------------------------- |
| `/api/auth/register`   | POST     | ⏳ Pending  | [api-plan.md](api-plan.md#21-authentication)    |
| `/api/auth/login`      | POST     | ⏳ Pending  | [api-plan.md](api-plan.md#21-authentication)    |
| `/api/auth`            | DELETE   | ⏳ Pending  | [api-plan.md](api-plan.md#21-authentication)    |
| `/api/generations`     | POST     | ⏳ Pending  | [api-plan.md](api-plan.md#22-generations)       |
| `/api/generations`     | GET      | ⏳ Pending  | [api-plan.md](api-plan.md#22-generations)       |
| **`/api/flashcards`**  | **POST** | **✅ Done** | [📁 Docs](flashcards-implementation-summary.md) |
| `/api/flashcards`      | GET      | ⏳ Pending  | [api-plan.md](api-plan.md#23-flashcards)        |
| `/api/flashcards/:id`  | GET      | ⏳ Pending  | [api-plan.md](api-plan.md#23-flashcards)        |
| `/api/flashcards/:id`  | PUT      | ⏳ Pending  | [api-plan.md](api-plan.md#23-flashcards)        |
| `/api/flashcards/:id`  | DELETE   | ⏳ Pending  | [api-plan.md](api-plan.md#23-flashcards)        |
| `/api/sessions/due`    | GET      | ⏳ Pending  | [api-plan.md](api-plan.md#24-study-sessions)    |
| `/api/sessions/review` | POST     | ⏳ Pending  | [api-plan.md](api-plan.md#24-study-sessions)    |

## 📂 Struktura katalogów projektu

```
10x-cards/
├── .ai/                        ← Jesteś tutaj (dokumentacja)
├── src/
│   ├── components/            - Komponenty UI (Astro + React)
│   ├── db/                    - Supabase clients i typy
│   ├── layouts/               - Astro layouts
│   ├── lib/                   - Services i helpers
│   │   └── services/          - Business logic
│   ├── middleware/            - Astro middleware
│   ├── pages/                 - Astro pages
│   │   └── api/               - API endpoints
│   ├── styles/                - Global styles
│   └── types.ts               - Shared types (DTOs)
├── supabase/
│   └── migrations/            - Database migrations
└── public/                    - Static assets
```

## 🔗 Przydatne linki

- **Tech Stack**: Astro 5, TypeScript 5, React 19, Tailwind 4, Supabase
- **Code Guidelines**: Zobacz `.cursor/rules/*.mdc`
- **Database Schema**: `supabase/migrations/`
- **Type Definitions**: `src/types.ts`, `src/db/database.types.ts`

## 💡 Wskazówki

### Konwencje nazewnicze

- Plany implementacji: `{resource}-endpoint-implementation-plan.md`
- Dokumentacja: `{resource}-endpoint-documentation.md`
- Przykłady: `{resource}-endpoint-examples.md`
- Testy: `{resource}-endpoint-tests.md`
- Podsumowanie: `{resource}-implementation-summary.md`

### Best Practices

1. Zawsze zacznij od planu implementacji
2. Dokumentuj podczas implementacji, nie po
3. Dodaj przykłady użycia dla developerów
4. Opisz wszystkie edge cases
5. Zaktualizuj `api-plan.md` po implementacji

---

**Last Updated**: 2025-10-16  
**Maintained by**: Development Team
