# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego
- Cel: Zapisanie zaakceptowanych propozycji flashcards powiązanych z daną generacją
- Metoda: POST
- URL: `/api/flashcards`
- Autoryzacja: Bearer token (użytkownik musi być uwierzytelniony)

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka: `/api/flashcards`
- Nagłówki:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Parametry:
  - Wymagane:
    - `generationId` (number)
    - `flashcards` (Array):
      - `front` (string, max 200 znaków)
      - `back` (string, max 500 znaków)
      - `source` ("ai-full" | "ai-edited" | "manual")
  - Opcjonalne: brak
- Przykładowe Body:
  ```json
  {
    "generationId": 123,
    "flashcards": [
      { "front": "Q1?", "back": "A1.", "source": "ai-full" },
      ...
    ]
  }
  ```

## 3. Wykorzystywane typy
- BulkCreateFlashcardsDto
- FlashcardCreatedDto
- BulkCreateFlashcardsResponseDto

## 4. Szczegóły odpowiedzi
- Kod: `201 Created`
- Nagłówki:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "created": [
      { "id": 1, "front": "Q1?", "back": "A1." },
      ...
    ]
  }
  ```

## 5. Przepływ danych
1. Middleware weryfikuje i wyciąga `userId` z tokena
2. Handler parsuje i waliduje body (Zod)
3. Serwis `flashcards.service.ts`:
   - Sprawdza istnienie generacji (`generationId`) i własność względem `userId`
   - Mapuje obiekty flashcards na strukturę do wstawienia
   - Wywołuje SupabaseClient:
     ```ts
     const { data, error } = await supabase
       .from('flashcards')
       .insert(mapa)
       .select('id, front, back');
     ```
   - Rzuca wyjątek w razie błędu DB
4. Handler formuje response DTO i zwraca 201

## 6. Względy bezpieczeństwa
- Autoryzacja: wymaga valid Bearer token, middleware (`src/middleware/index.ts`)
- Autoryzacja zasobu: upewnić się, że `generationId` należy do usera (RLS lub dodatkowe zapytanie)
- Parametryzacja zapytań przez Supabase SDK (brak SQL injection)
- Limitacja rozmiaru tablicy flashcards (np. `max(100)`) i rozmiaru danych JSON
- Sanitizacja treści przy wyświetlaniu (frontend)

## 7. Obsługa błędów
| Status | Warunek                                | Akcja                                      |
|--------|-----------------------------------------|--------------------------------------------|
| 400    | Nieprawidłowe dane wejściowe (Zod)     | Zwraca szczegóły błędów walidacji          |
| 401    | Brak lub nieprawidłowy token           | Zwraca `Unauthorized`                      |
| 404    | Generacja nie istnieje lub nie należy do usera | Zwraca `Not Found`                     |
| 201    | Sukces                                 | Zwraca utworzone rekordy                   |
| 500    | Błąd serwera (DB lub kod)              | Zwraca `Internal Server Error`             |

## 8. Wydajność
- Jedno zapytanie bulk-insert zamiast wielu
- Ograniczenie maksymalnej liczby flashcards na request (np. 100)
- Użycie `select` tylko na potrzebne kolumny (id, front, back)
- Supabase RLS na poziomie DB bez dodatkowych zapytań

## 9. Kroki implementacji
1. Utworzyć/rozwinąć plik serwisu: `src/lib/services/flashcards.service.ts`
2. Zaimplementować funkcję `bulkCreateFlashcards(dto, userId)`
3. Dodać Zod-schema w handlerze endpointa `src/pages/api/flashcards.ts`
4. W handlerze:
   - Wyciągnąć `userId` z `context.locals`
   - Walidować body
   - Wywołać serwis, obsłużyć wyjątki
5. Zarejestrować nowy endpoint w pliku Astro (`src/pages/api/flashcards.ts`)
6. Napisać testy jednostkowe i integracyjne dla:
   - Walidacji schematu
   - Autoryzacji i error path
   - Prawidłowego bulk-insertu
7. Zaktualizować dokumentację API i dodatek `components.json` jeśli istnieje

---
*Plan wdrażania przygotowany zgodnie ze stackiem Astro + Supabase i zasadami projektowania API.*
