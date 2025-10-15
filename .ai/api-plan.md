# REST API Plan

## 1. Resources
- User (`users` table)
- Flashcard (`flashcards` table)
- Generation (`generations` table)
- Generation Error Log (`generation_error_logs` table)
- Study Session (virtual resource leveraging spaced repetition algorithm)

## 2. Endpoints

### 2.1 Authentication

#### Register User
- Method: POST
- URL: /api/auth/register
- Description: Create a new user account
- Request Body:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassw0rd!"
  }
  ```
- Response (201 Created):
  ```json
  {
    "userId": "uuid-v4",
    "email": "user@example.com",
    "createdAt": "timestamp"
  }
  ```
- Errors:
  - 400 Bad Request (invalid email/password)
  - 409 Conflict (email already in use)

#### Login User
- Method: POST
- URL: /api/auth/login
- Description: Authenticate user and return JWT
- Request Body:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassw0rd!"
  }
  ```
- Response (200 OK):
  ```json
  {
    "accessToken": "jwt-token",
    "expiresIn": 3600
  }
  ```
- Errors:
  - 400 Bad Request
  - 401 Unauthorized (invalid credentials)

#### Delete Account
- Method: DELETE
- URL: /api/auth
- Description: Delete user and all associated data
- Authorization: Bearer token
- Response (204 No Content)
- Errors:
  - 401 Unauthorized

### 2.2 Generations

#### Create Generation & Get Proposals
- Method: POST
- URL: /api/generations
- Description: Submit source text to LLM, create generation record, and return flashcard proposals
- Authorization: Bearer token
- Request Body:
  ```json
  {
    "sourceText": "Long text between 1000 and 10000 characters",
    "model": "gpt-4"
  }
  ```
- Response (201 Created):
  ```json
  {
    "generationId": 123,
    "model": "gpt-4",
    "generatedCount": 10,
    "proposals": [
      { "proposalId": "p1", "front": "Q1?", "back": "A1." },
      ...
    ]
  }
  ```
- Validation:
  - `sourceText.length` between 1000 and 10000
- Errors:
  - 400 Bad Request
  - 429 Too Many Requests
  - 502 Bad Gateway (LLM API failure)

#### List Generations
- Method: GET
- URL: /api/generations
- Description: Retrieve paginated list of generations
- Authorization: Bearer token
- Query Params:
  - `page` (default: 1)
  - `limit` (default: 20)
- Response (200 OK):
  ```json
  {
    "data": [
      { "generationId": 123, "model": "gpt-4", "createdAt": "timestamp", "generatedCount": 10, "acceptedUneditedCount": 5, "acceptedEditedCount": 2 },
      ...
    ],
    "page": 1,
    "limit": 20,
    "total": 42
  }
  ```

### 2.3 Flashcards

#### Bulk Create Flashcards from Proposals
- Method: POST
- URL: /api/flashcards
- Description: Save accepted proposals as flashcards
- Authorization: Bearer token
- Request Body:
  ```json
  {
    "generationId": 123,
    "flashcards": [
      { "front": "Q1?", "back": "A1.", "source": "ai-full" },
      ...
    ]
  }
  ```
- Response (201 Created):
  ```json
  {
    "created": [ { "id": 1, "front": "Q1?", "back": "A1." }, ... ]
  }
  ```
- Validation:
  - `front.length` ≤ 200, `back.length` ≤ 500
  - `source` in ["ai-full","ai-edited","manual"]

#### List Flashcards
- Method: GET
- URL: /api/flashcards
- Description: Retrieve paginated, filtered list of user flashcards
- Authorization: Bearer token
- Query Params:
  - `page`, `limit`, `source` (filter by source), `due` (boolean for spaced repetition)
- Response (200 OK):
  ```json
  {
    "data": [
      { "id": 1, "front": "Q1?", "back": "A1.", "source": "ai-full", "due": true },
      ...
    ],
    "page": 1,
    "limit": 20,
    "total": 100
  }
  ```

#### Get Flashcard
- Method: GET
- URL: /api/flashcards/{flashcardId}
- Description: Retrieve a single flashcard details
- Authorization: Bearer token
- Response (200 OK): Flashcard object

#### Update Flashcard
- Method: PUT
- URL: /api/flashcards/{flashcardId}
- Description: Edit flashcard
- Authorization: Bearer token
- Request Body:
  ```json
  { "front": "Updated Q", "back": "Updated A" }
  ```
- Validation: same as bulk create
- Response (200 OK): Updated flashcard

#### Delete Flashcard
- Method: DELETE
- URL: /api/flashcards/{flashcardId}
- Description: Delete a flashcard
- Authorization: Bearer token
- Response (204 No Content)

### 2.4 Study Sessions

#### Get Due Flashcards
- Method: GET
- URL: /api/sessions/due
- Description: Retrieve flashcards due for review
- Authorization: Bearer token
- Query Params: `page`, `limit`
- Response (200 OK): paginated list of flashcards marked due

#### Submit Review Response
- Method: POST
- URL: /api/sessions/review
- Description: Submit user rating for a flashcard
- Authorization: Bearer token
- Request Body:
  ```json
  {
    "flashcardId": 1,
    "rating": "easy" // or "hard","medium"
  }
  ```
- Response (200 OK): Next flashcard or session summary

## 3. Authentication & Authorization
- Use Supabase Auth JWT tokens passed as `Authorization: Bearer <token>`
- Middleware to verify token and set `req.user.id`
- RLS in Supabase ensures row-level security; API enforces `user_id` filtering

## 4. Validation & Business Logic
- Validate lengths: `sourceText` (1000–10000 chars), `front` (≤200), `back` (≤500)
- Enforce `source` enum values
- Handle AI API failures, return 502 or 503
- Prevent accessing other users' resources (401/403)
- Implement pagination defaults and limits (max `limit`=100)
- Rate limit generation endpoint to prevent abuse

> **Assumptions:**
> - Bulk create for proposals aligns with performance requirements
> - Study session algorithm integration handled client-side with due data from API
> - Supabase RLS policies complement API-level authorization
