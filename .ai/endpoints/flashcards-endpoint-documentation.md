# POST /api/flashcards - Endpoint Documentation

## Overview
Endpoint służący do masowego tworzenia flashcards z zaakceptowanych propozycji wygenerowanych przez AI. Pozwala użytkownikom zapisać wybrane karty do swojej kolekcji.

## Endpoint Details
- **Method**: POST
- **URL**: `/api/flashcards`
- **Authentication**: Required (Bearer token)
- **Content-Type**: `application/json`

## Request

### Headers
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Request Body Schema
```typescript
{
  generationId: number;     // ID generacji, do której należą flashcards
  flashcards: Array<{
    front: string;          // Pytanie (max 200 znaków)
    back: string;           // Odpowiedź (max 500 znaków)
    source: "ai-full" | "ai-edited" | "manual";
  }>;
}
```

### Validation Rules
- `generationId`: musi być liczbą całkowitą dodatnią
- `flashcards`: tablica o długości 1-100 elementów
  - `front`: string, min 1 znak, max 200 znaków
  - `back`: string, min 1 znak, max 500 znaków
  - `source`: jeden z: `"ai-full"`, `"ai-edited"`, `"manual"`

### Example Request
```json
POST /api/flashcards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "generationId": 123,
  "flashcards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris is the capital and largest city of France.",
      "source": "ai-full"
    },
    {
      "front": "What is photosynthesis?",
      "back": "Photosynthesis is the process by which plants convert light energy into chemical energy.",
      "source": "ai-edited"
    }
  ]
}
```

## Response

### Success Response (201 Created)
```json
{
  "created": [
    {
      "id": 456,
      "front": "What is the capital of France?",
      "back": "Paris is the capital and largest city of France."
    },
    {
      "id": 457,
      "front": "What is photosynthesis?",
      "back": "Photosynthesis is the process by which plants convert light energy into chemical energy."
    }
  ]
}
```

**Response Schema**:
```typescript
{
  created: Array<{
    id: number;
    front: string;
    back: string;
  }>;
}
```

## Error Responses

### 400 Bad Request - Invalid JSON
```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

### 400 Bad Request - Validation Failed
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "path": "flashcards.0.front",
      "message": "Front must be at most 200 characters"
    },
    {
      "path": "flashcards",
      "message": "Maximum 100 flashcards per request"
    }
  ]
}
```

### 401 Unauthorized - Missing Token
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header"
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found - Generation Not Found
```json
{
  "error": "Not Found",
  "message": "Generation not found or does not belong to user"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to create flashcards"
}
```

## Business Logic

### Process Flow
1. **Authentication Check**
   - Weryfikacja tokena Bearer w nagłówku Authorization
   - Ekstrakcja userId z tokena
   - Odrzucenie requestu jeśli token nieprawidłowy (401)

2. **Request Validation**
   - Parsowanie JSON body
   - Walidacja za pomocą Zod schema
   - Zwrócenie szczegółowych błędów walidacji (400)

3. **Generation Verification**
   - Sprawdzenie czy generacja o podanym ID istnieje
   - Weryfikacja czy generacja należy do zalogowanego użytkownika
   - Odrzucenie jeśli nie istnieje lub nie należy do użytkownika (404)

4. **Bulk Insert**
   - Utworzenie wszystkich flashcards jednym zapytaniem do bazy
   - Automatyczne przypisanie `user_id` i `generation_id`
   - Pobranie utworzonych rekordów (id, front, back)

5. **Counter Update**
   - Zliczenie flashcards typu `ai-full` i `ai-edited`
   - Aktualizacja liczników w tabeli `generations`:
     - `accepted_unedited_count` += liczba kart "ai-full"
     - `accepted_edited_count` += liczba kart "ai-edited"

6. **Response Formation**
   - Zwrócenie listy utworzonych flashcards z kodem 201

### Security Considerations
- **Authentication**: Wymagany poprawny JWT token
- **Authorization**: Generacja musi należeć do zalogowanego użytkownika
- **Input Validation**: Wszystkie pola walidowane przez Zod
- **Rate Limiting**: Maksymalnie 100 flashcards na request
- **SQL Injection Protection**: Używamy Supabase SDK (parametryzowane zapytania)
- **Data Sanitization**: Walidacja długości stringów (front ≤ 200, back ≤ 500)

### Performance Optimization
- Single bulk insert zamiast wielu pojedynczych INSERT
- Minimum potrzebnych kolumn w SELECT (id, front, back)
- Indeksy na `generation_id` i `user_id` (zdefiniowane w migracji)
- Limit 100 flashcards per request zapobiega przeciążeniu

## Database Schema

### Tables Affected
1. **flashcards** (INSERT)
   ```sql
   id SERIAL PRIMARY KEY
   user_id UUID NOT NULL
   generation_id INTEGER REFERENCES generations(id)
   front VARCHAR(200) NOT NULL
   back VARCHAR(500) NOT NULL
   source VARCHAR(20) NOT NULL
   created_at TIMESTAMP DEFAULT NOW()
   updated_at TIMESTAMP DEFAULT NOW()
   ```

2. **generations** (UPDATE)
   ```sql
   accepted_unedited_count INTEGER DEFAULT 0
   accepted_edited_count INTEGER DEFAULT 0
   ```

## Implementation Files

### Service Layer
**File**: `src/lib/services/flashcards.service.ts`

**Function**: `bulkCreateFlashcards(supabase, dto, userId)`
- Weryfikuje własność generacji
- Wykonuje bulk insert
- Aktualizuje liczniki
- Zwraca utworzone flashcards

### API Endpoint
**File**: `src/pages/api/flashcards.ts`

**Handler**: `POST`
- Walidacja autoryzacji
- Walidacja body (Zod)
- Wywołanie serwisu
- Obsługa błędów
- Formatowanie odpowiedzi

### Types
**File**: `src/types.ts`

**DTOs**:
- `BulkCreateFlashcardsDto` - request body type
- `FlashcardCreatedDto` - pojedyncza utworzona flashcard
- `BulkCreateFlashcardsResponseDto` - response type

## Testing Scenarios

### Manual Testing with cURL

#### Success Case
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generationId": 1,
    "flashcards": [
      {"front": "Test Q1", "back": "Test A1", "source": "ai-full"},
      {"front": "Test Q2", "back": "Test A2", "source": "ai-edited"}
    ]
  }'
```

#### Validation Error (Too Long Front)
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generationId": 1,
    "flashcards": [
      {"front": "'$(printf 'A%.0s' {1..250})'", "back": "Answer", "source": "ai-full"}
    ]
  }'
```

#### Unauthorized (No Token)
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "generationId": 1,
    "flashcards": [
      {"front": "Question", "back": "Answer", "source": "ai-full"}
    ]
  }'
```

#### Not Found (Wrong Generation)
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generationId": 999999,
    "flashcards": [
      {"front": "Question", "back": "Answer", "source": "ai-full"}
    ]
  }'
```

## Edge Cases Handled

1. **Empty flashcards array** → 400 (min 1 required)
2. **More than 100 flashcards** → 400 (max 100 allowed)
3. **Front > 200 characters** → 400 (validation error)
4. **Back > 500 characters** → 400 (validation error)
5. **Invalid source value** → 400 (must be enum)
6. **Generation belongs to different user** → 404
7. **Non-existent generation** → 404
8. **Expired/invalid token** → 401
9. **Missing authorization header** → 401
10. **Malformed JSON** → 400

## Future Improvements

### Potential Enhancements
- [ ] Batch progress tracking dla bardzo dużych importów
- [ ] Webhook notifications po udanym imporcie
- [ ] Duplicate detection (podobne flashcards)
- [ ] Auto-tagging based on source text
- [ ] Bulk operations audit log
- [ ] Rate limiting per user (np. max 1000 flashcards/day)
- [ ] Async processing for large batches (>50 cards)
- [ ] Preview mode (dry-run without saving)

### Monitoring Recommendations
- Log successful bulk creates with count
- Monitor average response time
- Track validation error rates
- Alert on unusual bulk sizes
- Monitor generation counter consistency

---

**Last Updated**: 2025-10-16  
**Version**: 1.0.0  
**Status**: ✅ Implemented and Ready for Testing

