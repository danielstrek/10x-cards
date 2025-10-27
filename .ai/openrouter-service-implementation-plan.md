# Plan Implementacji Usługi OpenRouter

## 1. Opis Usługi

Usługa OpenRouter jest dedykowanym komponentem odpowiedzialnym za komunikację z API OpenRouter.ai w celu wysyłania zapytań do różnych modeli LLM (Large Language Models). Usługa ta stanowi warstwę abstrakcji między aplikacją a zewnętrznym API, zapewniając:

- **Scentralizowaną komunikację** - Jeden punkt kontaktu z API OpenRouter
- **Typowanie TypeScript** - Pełne wsparcie dla typów zapytań i odpowiedzi
- **Zarządzanie błędami** - Ustandaryzowana obsługa błędów komunikacji
- **Konfigurowalność** - Elastyczne ustawienia modeli i parametrów
- **Response Schema Support** - Wsparcie dla strukturalnych odpowiedzi JSON poprzez `response_format`
- **Bezpieczeństwo** - Bezpieczne zarządzanie kluczami API

### Kluczowe Cechy

1. **Obsługa różnych modeli** - OpenRouter zapewnia dostęp do modeli od różnych dostawców (OpenAI, Anthropic, Google, Meta, itp.)
2. **Strukturalne odpowiedzi** - Możliwość wymuszenia określonego schematu JSON w odpowiedzi modelu
3. **Konfiguracja parametrów** - Temperatura, max_tokens, top_p, frequency_penalty i inne
4. **Monitoring kosztów** - Informacje o zużyciu tokenów dla każdego zapytania
5. **Retry logic** - Automatyczne ponowne próby w przypadku tymczasowych błędów

## 2. Opis Konstruktora

Konstruktor usługi OpenRouter inicjalizuje instancję z podstawową konfiguracją:

```typescript
constructor(config: OpenRouterServiceConfig)
```

### Parametry Konfiguracji

```typescript
interface OpenRouterServiceConfig {
  // Klucz API OpenRouter (WYMAGANE)
  apiKey: string;
  
  // Bazowy URL API (opcjonalne, domyślnie: 'https://openrouter.ai/api/v1')
  baseUrl?: string;
  
  // Domyślny model do użycia (opcjonalne)
  defaultModel?: string;
  
  // Domyślne parametry dla wszystkich zapytań (opcjonalne)
  defaultParams?: Partial<OpenRouterRequestParams>;
  
  // Nagłówki HTTP-Referer i X-Title dla identyfikacji aplikacji (opcjonalne)
  appInfo?: {
    referer: string;  // np. 'https://10x-cards.app'
    title: string;    // np. '10x Cards'
  };
  
  // Konfiguracja retry logic (opcjonalne)
  retryConfig?: {
    maxRetries: number;      // Maksymalna liczba prób (domyślnie: 3)
    retryDelay: number;      // Opóźnienie między próbami w ms (domyślnie: 1000)
    retryableStatuses: number[]; // Statusy HTTP do ponowienia (domyślnie: [429, 500, 502, 503, 504])
  };
  
  // Timeout dla zapytań w ms (opcjonalne, domyślnie: 60000)
  timeout?: number;
}
```

### Przykład Użycia

```typescript
const openRouterService = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'openai/gpt-4o-mini',
  defaultParams: {
    temperature: 0.7,
    max_tokens: 2000,
  },
  appInfo: {
    referer: 'https://10x-cards.app',
    title: '10x Cards',
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [429, 500, 502, 503, 504],
  },
  timeout: 60000,
});
```

## 3. Publiczne Metody i Pola

### 3.1. Metoda `chat`

Główna metoda do wysyłania zapytań chat completion do OpenRouter.

```typescript
async chat(request: OpenRouterChatRequest): Promise<OpenRouterChatResponse>
```

#### Parametry

```typescript
interface OpenRouterChatRequest {
  // Wiadomości w konwersacji (WYMAGANE)
  messages: OpenRouterMessage[];
  
  // Model do użycia (opcjonalne, użyje defaultModel z konstruktora)
  model?: string;
  
  // Parametry modelu (opcjonalne)
  params?: OpenRouterRequestParams;
  
  // Response format dla strukturalnych odpowiedzi (opcjonalne)
  responseFormat?: OpenRouterResponseFormat;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequestParams {
  // Temperatura (0.0 - 2.0) - kontroluje losowość (domyślnie: 1.0)
  temperature?: number;
  
  // Maksymalna liczba tokenów w odpowiedzi (domyślnie: zależy od modelu)
  max_tokens?: number;
  
  // Top P (0.0 - 1.0) - nucleus sampling (domyślnie: 1.0)
  top_p?: number;
  
  // Frequency penalty (0.0 - 2.0) - zmniejsza powtarzanie (domyślnie: 0.0)
  frequency_penalty?: number;
  
  // Presence penalty (0.0 - 2.0) - zachęca do nowych tematów (domyślnie: 0.0)
  presence_penalty?: number;
  
  // Stop sequences - tablice stringów, gdzie model przestanie generować
  stop?: string[];
  
  // Top K - liczba najlepszych tokenów do rozważenia
  top_k?: number;
  
  // Repetition penalty - kara za powtarzanie
  repetition_penalty?: number;
}

interface OpenRouterResponseFormat {
  type: 'json_schema';
  json_schema: {
    // Nazwa schematu (WYMAGANE)
    name: string;
    
    // Czy wymuszać zgodność ze schematem (WYMAGANE dla structured outputs)
    strict: boolean;
    
    // JSON Schema object (WYMAGANE)
    schema: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
      additionalProperties?: boolean;
    };
    
    // Opis schematu (opcjonalne)
    description?: string;
  };
}
```

#### Zwracana Wartość

```typescript
interface OpenRouterChatResponse {
  // ID odpowiedzi
  id: string;
  
  // Model użyty do wygenerowania odpowiedzi
  model: string;
  
  // Treść odpowiedzi
  content: string;
  
  // Powód zakończenia: 'stop', 'length', 'content_filter', 'tool_calls', 'error'
  finishReason: string;
  
  // Informacje o zużyciu tokenów
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  // Czas utworzenia (Unix timestamp)
  created: number;
}
```

#### Przykład Użycia - Podstawowe Chat Completion

```typescript
const response = await openRouterService.chat({
  model: 'anthropic/claude-3.5-sonnet',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful educational assistant.',
    },
    {
      role: 'user',
      content: 'Explain quantum computing in simple terms.',
    },
  ],
  params: {
    temperature: 0.7,
    max_tokens: 500,
  },
});

console.log(response.content);
console.log(`Used ${response.usage.totalTokens} tokens`);
```

#### Przykład Użycia - Strukturalna Odpowiedź (Response Format)

```typescript
// Definicja schematu dla flashcards
const flashcardsSchema = {
  type: 'object' as const,
  properties: {
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          front: {
            type: 'string',
            description: 'Question on the front of the flashcard',
            maxLength: 200,
          },
          back: {
            type: 'string',
            description: 'Answer on the back of the flashcard',
            maxLength: 500,
          },
        },
        required: ['front', 'back'],
        additionalProperties: false,
      },
      minItems: 5,
      maxItems: 20,
    },
  },
  required: ['flashcards'],
  additionalProperties: false,
};

// Wysłanie zapytania ze schematem
const response = await openRouterService.chat({
  model: 'openai/gpt-4o-2024-08-06', // Tylko niektóre modele wspierają structured outputs
  messages: [
    {
      role: 'system',
      content: `You are an expert educational content creator specialized in creating high-quality flashcards.
      
Generate flashcards that:
1. Cover the most important concepts
2. Are clear and concise
3. Have specific, testable questions
4. Follow best practices for spaced repetition`,
    },
    {
      role: 'user',
      content: `Generate flashcards from this text:\n\n${sourceText}`,
    },
  ],
  params: {
    temperature: 0.7,
    max_tokens: 2000,
  },
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'flashcards_response',
      strict: true,
      schema: flashcardsSchema,
    },
  },
});

// Odpowiedź będzie zawierała poprawnie sformatowany JSON zgodny ze schematem
const flashcards = JSON.parse(response.content);
console.log(flashcards.flashcards); // Array<{front: string, back: string}>
```

### 3.2. Metoda `chatStreaming`

Metoda do strumieniowania odpowiedzi w czasie rzeczywistym (opcjonalna funkcjonalność).

```typescript
async chatStreaming(
  request: OpenRouterChatRequest,
  onChunk: (chunk: string) => void
): Promise<OpenRouterChatResponse>
```

#### Przykład Użycia

```typescript
let fullResponse = '';

const response = await openRouterService.chatStreaming(
  {
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Write a short story.' },
    ],
  },
  (chunk) => {
    fullResponse += chunk;
    console.log('Received chunk:', chunk);
  }
);

console.log('Final response:', fullResponse);
```

### 3.3. Metoda `getAvailableModels`

Pobiera listę dostępnych modeli z OpenRouter.

```typescript
async getAvailableModels(): Promise<OpenRouterModel[]>
```

#### Zwracana Wartość

```typescript
interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;      // Koszt za 1M tokenów promptu
    completion: string;  // Koszt za 1M tokenów completion
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
}
```

#### Przykład Użycia

```typescript
const models = await openRouterService.getAvailableModels();

// Wyświetl modele od OpenAI
const openaiModels = models.filter(m => m.id.startsWith('openai/'));
console.log('OpenAI Models:', openaiModels);

// Znajdź najtańszy model
const cheapestModel = models.sort((a, b) => 
  parseFloat(a.pricing.prompt) - parseFloat(b.pricing.prompt)
)[0];
console.log('Cheapest model:', cheapestModel.id);
```

### 3.4. Właściwość `config`

Dostęp tylko do odczytu do aktualnej konfiguracji usługi.

```typescript
readonly config: Readonly<OpenRouterServiceConfig>
```

## 4. Prywatne Metody i Pola

### 4.1. Prywatne Pola

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly defaultModel?: string;
private readonly defaultParams: OpenRouterRequestParams;
private readonly appInfo?: { referer: string; title: string };
private readonly retryConfig: Required<RetryConfig>;
private readonly timeout: number;
```

### 4.2. Metoda `makeRequest`

Wykonuje zapytanie HTTP do OpenRouter z retry logic.

```typescript
private async makeRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  body?: unknown
): Promise<T>
```

**Odpowiedzialności:**
- Budowanie pełnego URL z baseUrl i endpoint
- Dodawanie nagłówków autoryzacji i identyfikacji aplikacji
- Obsługa timeout
- Implementacja retry logic dla błędów przejściowych
- Parsowanie i walidacja odpowiedzi

### 4.3. Metoda `buildHeaders`

Buduje nagłówki HTTP dla zapytania.

```typescript
private buildHeaders(): Record<string, string>
```

**Zwraca:**
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.apiKey}`,
  'HTTP-Referer': this.appInfo?.referer || '',
  'X-Title': this.appInfo?.title || '',
}
```

### 4.4. Metoda `buildRequestBody`

Buduje ciało zapytania dla OpenRouter API.

```typescript
private buildRequestBody(request: OpenRouterChatRequest): OpenRouterAPIRequestBody
```

**Odpowiedzialności:**
- Łączenie parametrów z defaultParams
- Walidacja i formatowanie messages
- Dodawanie response_format jeśli jest określony
- Walidacja modelu

```typescript
interface OpenRouterAPIRequestBody {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  top_k?: number;
  repetition_penalty?: number;
  response_format?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: object;
      description?: string;
    };
  };
}
```

### 4.5. Metoda `parseResponse`

Parsuje i waliduje odpowiedź z OpenRouter.

```typescript
private parseResponse(apiResponse: OpenRouterAPIResponse): OpenRouterChatResponse
```

**Odpowiedzialności:**
- Walidacja struktury odpowiedzi
- Ekstrakcja content z choices[0].message.content
- Mapowanie usage statistics
- Obsługa różnych finish_reason

### 4.6. Metoda `handleError`

Centralna obsługa błędów z OpenRouter API.

```typescript
private handleError(error: unknown, context: string): never
```

**Odpowiedzialności:**
- Klasyfikacja błędów (network, API, validation, timeout)
- Tworzenie szczegółowych komunikatów błędów
- Logowanie błędów
- Rzucanie typowanych błędów

### 4.7. Metoda `shouldRetry`

Określa, czy zapytanie powinno zostać ponowione.

```typescript
private shouldRetry(statusCode: number, attempt: number): boolean
```

**Logika:**
- Sprawdza czy status jest w retryableStatuses
- Sprawdza czy attempt < maxRetries
- Specjalna obsługa dla 429 (rate limit) z exponential backoff

### 4.8. Metoda `calculateRetryDelay`

Oblicza opóźnienie przed kolejną próbą (exponential backoff).

```typescript
private calculateRetryDelay(attempt: number, statusCode: number): number
```

**Implementacja:**
- Dla 429: używa Retry-After header jeśli dostępny
- Dla innych: exponential backoff z jitter
- Formula: `baseDelay * (2 ^ attempt) + random(0, 1000)`

### 4.9. Metoda `validateMessages`

Waliduje tablicę messages przed wysłaniem.

```typescript
private validateMessages(messages: OpenRouterMessage[]): void
```

**Walidacja:**
- Minimum 1 message
- Każdy message ma role i content
- Role jest jednym z: 'system', 'user', 'assistant'
- Content nie jest pusty
- Pierwsze message może być 'system' lub 'user'
- Messages alternują między 'user' a 'assistant' (z wyjątkiem system)

### 4.10. Metoda `validateResponseFormat`

Waliduje poprawność response_format przed wysłaniem.

```typescript
private validateResponseFormat(responseFormat: OpenRouterResponseFormat): void
```

**Walidacja:**
- type === 'json_schema'
- json_schema.name jest niepusty
- json_schema.strict === true (dla structured outputs)
- json_schema.schema jest poprawnym JSON Schema
- schema.type === 'object'
- schema ma properties
- Sprawdza maksymalną głębokość zagnieżdżenia (np. max 5 poziomów)

## 5. Obsługa Błędów

### 5.1. Hierarchia Błędów

Usługa definiuje własne typy błędów dla różnych scenariuszy:

```typescript
// Bazowa klasa błędów OpenRouter
class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

// Błąd walidacji
class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'OpenRouterValidationError';
  }
}

// Błąd autoryzacji
class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string = 'Invalid API key') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'OpenRouterAuthError';
  }
}

// Błąd rate limit
class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'OpenRouterRateLimitError';
  }
}

// Błąd modelu
class OpenRouterModelError extends OpenRouterError {
  constructor(message: string, public readonly modelId?: string) {
    super(message, 'MODEL_ERROR', 400);
    this.name = 'OpenRouterModelError';
  }
}

// Błąd API
class OpenRouterAPIError extends OpenRouterError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'OpenRouterAPIError';
  }
}

// Błąd sieci/timeout
class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string = 'Network error or timeout') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'OpenRouterNetworkError';
  }
}

// Błąd parsowania odpowiedzi
class OpenRouterParseError extends OpenRouterError {
  constructor(message: string, public readonly rawResponse?: string) {
    super(message, 'PARSE_ERROR', 0);
    this.name = 'OpenRouterParseError';
  }
}
```

### 5.2. Scenariusze Błędów i Obsługa

#### Błąd 1: Nieprawidłowy Klucz API (401)

**Przyczyna:** Brak klucza API lub nieprawidłowy klucz

**Obsługa:**
```typescript
try {
  const response = await openRouterService.chat(request);
} catch (error) {
  if (error instanceof OpenRouterAuthError) {
    console.error('Invalid API key. Please check your configuration.');
    // Nie ponawiaj - wymaga interwencji
    return { error: 'Service configuration error' };
  }
}
```

#### Błąd 2: Rate Limit (429)

**Przyczyna:** Przekroczono limit zapytań

**Obsługa:**
```typescript
try {
  const response = await openRouterService.chat(request);
} catch (error) {
  if (error instanceof OpenRouterRateLimitError) {
    const retryAfter = error.retryAfter || 60;
    console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    // Opcjonalnie: automatyczne kolejkowanie lub informacja dla użytkownika
    return { 
      error: 'Too many requests', 
      retryAfter: retryAfter 
    };
  }
}
```

#### Błąd 3: Błąd Walidacji (400)

**Przyczyna:** Nieprawidłowe parametry zapytania

**Obsługa:**
```typescript
try {
  const response = await openRouterService.chat(request);
} catch (error) {
  if (error instanceof OpenRouterValidationError) {
    console.error('Validation error:', error.details);
    // Pokaż szczegóły użytkownikowi lub napraw zapytanie
    return { 
      error: 'Invalid request', 
      details: error.details 
    };
  }
}
```

#### Błąd 4: Błąd Modelu (400/404)

**Przyczyna:** Nieprawidłowa nazwa modelu lub model niedostępny

**Obsługa:**
```typescript
try {
  const response = await openRouterService.chat(request);
} catch (error) {
  if (error instanceof OpenRouterModelError) {
    console.error(`Model error: ${error.message}`, error.modelId);
    // Użyj fallback modelu
    return await openRouterService.chat({
      ...request,
      model: 'anthropic/claude-3.5-sonnet', // Fallback model
    });
  }
}
```

#### Błąd 5: Timeout/Błąd Sieci

**Przyczyna:** Przekroczony timeout lub problemy z siecią

**Obsługa:**
```typescript
try {
  const response = await openRouterService.chat(request);
} catch (error) {
  if (error instanceof OpenRouterNetworkError) {
    console.error('Network error:', error.message);
    // Retry logic już jest wbudowany w usługę
    // Jeśli dalej nie działa, pokaż error użytkownikowi
    return { 
      error: 'Service temporarily unavailable. Please try again.' 
    };
  }
}
```

#### Błąd 6: Błąd Parsowania Odpowiedzi

**Przyczyna:** Odpowiedź z API nie jest w oczekiwanym formacie

**Obsługa:**
```typescript
try {
  const response = await openRouterService.chat(request);
} catch (error) {
  if (error instanceof OpenRouterParseError) {
    console.error('Failed to parse response:', error.rawResponse);
    // Zaloguj błąd dla debugowania
    logger.error('Parse error', {
      error: error.message,
      rawResponse: error.rawResponse,
      request: request,
    });
    return { error: 'Invalid response from AI service' };
  }
}
```

#### Błąd 7: Błąd API (5xx)

**Przyczyna:** Wewnętrzny błąd serwera OpenRouter

**Obsługa:**
```typescript
try {
  const response = await openRouterService.chat(request);
} catch (error) {
  if (error instanceof OpenRouterAPIError) {
    console.error(`API error (${error.statusCode}):`, error.message);
    // Retry logic już jest wbudowany w usługę
    // Jeśli wszystkie próby zawiodły
    return { 
      error: 'AI service error. Please try again later.',
      statusCode: error.statusCode 
    };
  }
}
```

### 5.3. Kompleksowy Handler Błędów

```typescript
async function handleOpenRouterCall(
  request: OpenRouterChatRequest
): Promise<OpenRouterChatResponse | ErrorResponse> {
  try {
    return await openRouterService.chat(request);
  } catch (error) {
    // Typowane błędy OpenRouter
    if (error instanceof OpenRouterAuthError) {
      return {
        success: false,
        error: 'Configuration error',
        message: 'Invalid API credentials',
        code: 'AUTH_ERROR',
        statusCode: 401,
      };
    }

    if (error instanceof OpenRouterRateLimitError) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_ERROR',
        statusCode: 429,
        retryAfter: error.retryAfter,
      };
    }

    if (error instanceof OpenRouterValidationError) {
      return {
        success: false,
        error: 'Validation error',
        message: error.message,
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.details,
      };
    }

    if (error instanceof OpenRouterModelError) {
      return {
        success: false,
        error: 'Model error',
        message: error.message,
        code: 'MODEL_ERROR',
        statusCode: 400,
        modelId: error.modelId,
      };
    }

    if (error instanceof OpenRouterNetworkError) {
      return {
        success: false,
        error: 'Network error',
        message: 'Failed to connect to AI service',
        code: 'NETWORK_ERROR',
        statusCode: 503,
      };
    }

    if (error instanceof OpenRouterParseError) {
      return {
        success: false,
        error: 'Parse error',
        message: 'Invalid response from AI service',
        code: 'PARSE_ERROR',
        statusCode: 502,
      };
    }

    if (error instanceof OpenRouterAPIError) {
      return {
        success: false,
        error: 'API error',
        message: error.message,
        code: 'API_ERROR',
        statusCode: error.statusCode || 500,
        details: error.details,
      };
    }

    // Nieoczekiwany błąd
    console.error('Unexpected error in OpenRouter call:', error);
    return {
      success: false,
      error: 'Unknown error',
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    };
  }
}
```

## 6. Kwestie Bezpieczeństwa

### 6.1. Zarządzanie Kluczami API

**Najlepsze Praktyki:**

1. **Nigdy nie hardcode'uj kluczy API w kodzie**
```typescript
// ❌ ZŁE
const service = new OpenRouterService({
  apiKey: 'sk-or-v1-abc123...',
});

// ✅ DOBRE
const service = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
```

2. **Używaj zmiennych środowiskowych**
```bash
# .env (nigdy nie commituj do repo!)
OPENROUTER_API_KEY=sk-or-v1-abc123...
```

3. **W Astro, używaj import.meta.env**
```typescript
// Dla kodu server-side w Astro
const apiKey = import.meta.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error('OPENROUTER_API_KEY is not configured');
}
```

4. **Dodaj .env do .gitignore**
```gitignore
.env
.env.local
.env.*.local
```

### 6.2. Ochrona Przed Wyciekiem Kluczy

**W Kodzie Klienckim:**

```typescript
// ❌ NIGDY nie wywołuj usługi OpenRouter bezpośrednio z przeglądarki
// Klucz API byłby widoczny w narzędziach deweloperskich!

// ✅ Zawsze używaj API endpoint na serwerze
// src/pages/api/chat.ts
export const POST: APIRoute = async ({ request, locals }) => {
  // Klucz API jest bezpiecznie przechowywany na serwerze
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  
  const openRouterService = new OpenRouterService({ apiKey });
  const response = await openRouterService.chat(requestData);
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### 6.3. Sanityzacja Danych Wejściowych

**Walidacja User Input:**

```typescript
import { z } from 'zod';

// Definiuj ścisłe schematy walidacji
const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long'),
  model: z
    .string()
    .regex(/^[a-z0-9\-\/]+$/, 'Invalid model name')
    .optional(),
});

// Waliduj przed wysłaniem do OpenRouter
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  
  const validationResult = chatRequestSchema.safeParse(body);
  
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: validationResult.error.errors,
      }),
      { status: 400 }
    );
  }
  
  // Bezpieczne dane
  const { message, model } = validationResult.data;
  // ... wywołanie OpenRouter
};
```

### 6.4. Rate Limiting i Ochrona Przed Abuse

**Implementacja Rate Limiting:**

```typescript
// Prosty in-memory rate limiter (dla produkcji użyj Redis)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(userId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Usuń stare requesty spoza okna
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < windowMs
    );
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter();

export const POST: APIRoute = async ({ request, locals }) => {
  const userId = locals.user?.id;
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }
  
  // Max 10 requestów na minutę
  if (!rateLimiter.isAllowed(userId, 10, 60000)) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please wait before making another request',
      }),
      { status: 429 }
    );
  }
  
  // Kontynuuj normalne przetwarzanie
};
```

### 6.5. Logging i Monitoring

**Bezpieczne Logowanie:**

```typescript
// ❌ NIE loguj wrażliwych danych
console.log('API Key:', apiKey);
console.log('Full request:', request);

// ✅ Loguj tylko niezbędne informacje
console.log('OpenRouter request', {
  model: request.model,
  messageCount: request.messages.length,
  userId: userId,
  timestamp: new Date().toISOString(),
});

// Maskuj wrażliwe dane w logach
function maskApiKey(key: string): string {
  if (key.length < 8) return '***';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

console.log('Using API key:', maskApiKey(apiKey));
```

### 6.6. CORS i CSP Headers

**Konfiguracja Security Headers:**

```typescript
// astro.config.mjs
export default defineConfig({
  // ... inne ustawienia
  vite: {
    server: {
      headers: {
        // Content Security Policy
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline';",
        // Zapobiegaj ładowaniu strony w iframe
        'X-Frame-Options': 'DENY',
        // Wymuszaj HTTPS
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        // Zapobiegaj MIME type sniffing
        'X-Content-Type-Options': 'nosniff',
      },
    },
  },
});
```

### 6.7. Timeout i Resource Limits

**Ochrona Przed Wyczerpaniem Zasobów:**

```typescript
const openRouterService = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  timeout: 60000, // 60 sekund max
  defaultParams: {
    max_tokens: 2000, // Ogranicz długość odpowiedzi
  },
});

// W endpoint
export const POST: APIRoute = async ({ request }) => {
  // Ustaw timeout dla całego requestu
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000);
  
  try {
    const response = await openRouterService.chat(requestData);
    clearTimeout(timeoutId);
    return new Response(JSON.stringify(response));
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'Request timeout' }),
        { status: 504 }
      );
    }
    throw error;
  }
};
```

## 7. Plan Wdrożenia Krok Po Kroku

### Krok 1: Przygotowanie Środowiska

#### 1.1. Instalacja Zależności

```bash
# Zainstaluj wymagane pakiety
npm install zod

# Jeśli używasz TypeScript (już zainstalowany w projekcie)
npm install -D @types/node
```

#### 1.2. Konfiguracja Zmiennych Środowiskowych

```bash
# Utwórz plik .env w głównym katalogu projektu
touch .env

# Dodaj klucz API OpenRouter
echo "OPENROUTER_API_KEY=your-api-key-here" >> .env
```

Upewnij się, że `.env` jest w `.gitignore`:

```gitignore
# .gitignore
.env
.env.local
.env.production
```

#### 1.3. Konfiguracja TypeScript dla Zmiennych Środowiskowych

Zaktualizuj `src/env.d.ts`:

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Krok 2: Tworzenie Typów i Interfejsów

Utwórz plik `src/lib/services/openrouter.types.ts`:

```typescript
// src/lib/services/openrouter.types.ts

/**
 * Konfiguracja usługi OpenRouter
 */
export interface OpenRouterServiceConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  defaultParams?: Partial<OpenRouterRequestParams>;
  appInfo?: {
    referer: string;
    title: string;
  };
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    retryableStatuses: number[];
  };
  timeout?: number;
}

/**
 * Wiadomość w konwersacji
 */
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Parametry zapytania do modelu
 */
export interface OpenRouterRequestParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  top_k?: number;
  repetition_penalty?: number;
}

/**
 * Format odpowiedzi (structured outputs)
 */
export interface OpenRouterResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
      additionalProperties?: boolean;
    };
    description?: string;
  };
}

/**
 * Zapytanie chat completion
 */
export interface OpenRouterChatRequest {
  messages: OpenRouterMessage[];
  model?: string;
  params?: OpenRouterRequestParams;
  responseFormat?: OpenRouterResponseFormat;
}

/**
 * Odpowiedź chat completion
 */
export interface OpenRouterChatResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  created: number;
}

/**
 * Informacje o modelu
 */
export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
}

/**
 * Surowa odpowiedź z OpenRouter API
 */
export interface OpenRouterAPIResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

/**
 * Ciało zapytania do OpenRouter API
 */
export interface OpenRouterAPIRequestBody {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  top_k?: number;
  repetition_penalty?: number;
  response_format?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: object;
      description?: string;
    };
  };
}
```

### Krok 3: Implementacja Klas Błędów

Utwórz plik `src/lib/services/openrouter.errors.ts`:

```typescript
// src/lib/services/openrouter.errors.ts

/**
 * Bazowa klasa błędów OpenRouter
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';
    
    // Zachowaj stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Błąd walidacji parametrów
 */
export class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'OpenRouterValidationError';
  }
}

/**
 * Błąd autoryzacji (invalid API key)
 */
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string = 'Invalid API key') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'OpenRouterAuthError';
  }
}

/**
 * Błąd rate limit
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'OpenRouterRateLimitError';
  }
}

/**
 * Błąd modelu (nieprawidłowa nazwa lub model niedostępny)
 */
export class OpenRouterModelError extends OpenRouterError {
  constructor(message: string, public readonly modelId?: string) {
    super(message, 'MODEL_ERROR', 400);
    this.name = 'OpenRouterModelError';
  }
}

/**
 * Błąd API OpenRouter
 */
export class OpenRouterAPIError extends OpenRouterError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'OpenRouterAPIError';
  }
}

/**
 * Błąd sieci lub timeout
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string = 'Network error or timeout') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'OpenRouterNetworkError';
  }
}

/**
 * Błąd parsowania odpowiedzi
 */
export class OpenRouterParseError extends OpenRouterError {
  constructor(message: string, public readonly rawResponse?: string) {
    super(message, 'PARSE_ERROR', 0);
    this.name = 'OpenRouterParseError';
  }
}
```

### Krok 4: Implementacja Głównej Klasy Usługi

Utwórz plik `src/lib/services/openrouter.service.ts`:

```typescript
// src/lib/services/openrouter.service.ts

import type {
  OpenRouterServiceConfig,
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterModel,
  OpenRouterAPIResponse,
  OpenRouterAPIRequestBody,
  OpenRouterMessage,
  OpenRouterResponseFormat,
  OpenRouterRequestParams,
} from './openrouter.types';

import {
  OpenRouterError,
  OpenRouterValidationError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterModelError,
  OpenRouterAPIError,
  OpenRouterNetworkError,
  OpenRouterParseError,
} from './openrouter.errors';

/**
 * Usługa do komunikacji z OpenRouter API
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel?: string;
  private readonly defaultParams: OpenRouterRequestParams;
  private readonly appInfo?: { referer: string; title: string };
  private readonly retryConfig: Required<{
    maxRetries: number;
    retryDelay: number;
    retryableStatuses: number[];
  }>;
  private readonly timeout: number;

  /**
   * Konstruktor usługi OpenRouter
   */
  constructor(config: OpenRouterServiceConfig) {
    // Walidacja wymaganych parametrów
    if (!config.apiKey) {
      throw new OpenRouterValidationError('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.defaultModel = config.defaultModel;
    this.defaultParams = config.defaultParams || {};
    this.appInfo = config.appInfo;
    this.timeout = config.timeout || 60000;

    // Konfiguracja retry logic
    this.retryConfig = {
      maxRetries: config.retryConfig?.maxRetries ?? 3,
      retryDelay: config.retryConfig?.retryDelay ?? 1000,
      retryableStatuses: config.retryConfig?.retryableStatuses ?? [
        429, 500, 502, 503, 504,
      ],
    };
  }

  /**
   * Getter dla konfiguracji (read-only)
   */
  get config(): Readonly<OpenRouterServiceConfig> {
    return {
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      defaultParams: this.defaultParams,
      appInfo: this.appInfo,
      retryConfig: this.retryConfig,
      timeout: this.timeout,
    };
  }

  /**
   * Wysyła zapytanie chat completion do OpenRouter
   */
  async chat(request: OpenRouterChatRequest): Promise<OpenRouterChatResponse> {
    // Walidacja messages
    this.validateMessages(request.messages);

    // Walidacja response format jeśli podany
    if (request.responseFormat) {
      this.validateResponseFormat(request.responseFormat);
    }

    // Zbuduj ciało zapytania
    const requestBody = this.buildRequestBody(request);

    // Wykonaj zapytanie z retry logic
    const apiResponse = await this.makeRequest<OpenRouterAPIResponse>(
      '/chat/completions',
      'POST',
      requestBody
    );

    // Parsuj i zwróć odpowiedź
    return this.parseResponse(apiResponse);
  }

  /**
   * Pobiera listę dostępnych modeli
   */
  async getAvailableModels(): Promise<OpenRouterModel[]> {
    const response = await this.makeRequest<{ data: OpenRouterModel[] }>(
      '/models',
      'GET'
    );

    return response.data;
  }

  /**
   * Buduje nagłówki HTTP dla zapytania
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (this.appInfo) {
      headers['HTTP-Referer'] = this.appInfo.referer;
      headers['X-Title'] = this.appInfo.title;
    }

    return headers;
  }

  /**
   * Buduje ciało zapytania dla OpenRouter API
   */
  private buildRequestBody(
    request: OpenRouterChatRequest
  ): OpenRouterAPIRequestBody {
    // Użyj modelu z requestu lub domyślnego
    const model = request.model || this.defaultModel;

    if (!model) {
      throw new OpenRouterValidationError(
        'Model must be specified in request or as default in config'
      );
    }

    // Połącz parametry
    const params = {
      ...this.defaultParams,
      ...request.params,
    };

    // Zbuduj ciało zapytania
    const body: OpenRouterAPIRequestBody = {
      model,
      messages: request.messages,
      ...params,
    };

    // Dodaj response_format jeśli podany
    if (request.responseFormat) {
      body.response_format = request.responseFormat;
    }

    return body;
  }

  /**
   * Wykonuje zapytanie HTTP z retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Utwórz AbortController dla timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers: this.buildHeaders(),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Obsługa błędów HTTP
        if (!response.ok) {
          await this.handleHttpError(response, attempt);
          continue; // Retry
        }

        // Parsuj odpowiedź
        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Obsługa timeout
        if (lastError.name === 'AbortError') {
          if (attempt < this.retryConfig.maxRetries) {
            const delay = this.calculateRetryDelay(attempt, 0);
            await this.sleep(delay);
            continue;
          }
          throw new OpenRouterNetworkError('Request timeout');
        }

        // Obsługa błędów sieci
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateRetryDelay(attempt, 0);
          await this.sleep(delay);
          continue;
        }

        throw new OpenRouterNetworkError(
          `Network error: ${lastError.message}`
        );
      }
    }

    // Wszystkie próby zawiodły
    throw lastError || new OpenRouterNetworkError('All retry attempts failed');
  }

  /**
   * Obsługuje błędy HTTP
   */
  private async handleHttpError(
    response: Response,
    attempt: number
  ): Promise<void> {
    const statusCode = response.status;
    let errorMessage: string;
    let errorDetails: unknown;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
      errorDetails = errorData;
    } catch {
      errorMessage = await response.text();
      errorDetails = errorMessage;
    }

    // Błąd autoryzacji - nie retry
    if (statusCode === 401 || statusCode === 403) {
      throw new OpenRouterAuthError(errorMessage);
    }

    // Rate limit
    if (statusCode === 429) {
      const retryAfter = this.parseRetryAfter(response.headers);

      if (attempt < this.retryConfig.maxRetries) {
        const delay = retryAfter
          ? retryAfter * 1000
          : this.calculateRetryDelay(attempt, statusCode);
        await this.sleep(delay);
        return; // Retry
      }

      throw new OpenRouterRateLimitError(errorMessage, retryAfter);
    }

    // Błędy modelu
    if (statusCode === 400 && errorMessage.toLowerCase().includes('model')) {
      throw new OpenRouterModelError(errorMessage);
    }

    // Błędy serwera - retry
    if (this.shouldRetry(statusCode, attempt)) {
      const delay = this.calculateRetryDelay(attempt, statusCode);
      await this.sleep(delay);
      return; // Retry
    }

    // Inne błędy API
    throw new OpenRouterAPIError(errorMessage, statusCode, errorDetails);
  }

  /**
   * Sprawdza czy należy ponowić zapytanie
   */
  private shouldRetry(statusCode: number, attempt: number): boolean {
    return (
      attempt < this.retryConfig.maxRetries &&
      this.retryConfig.retryableStatuses.includes(statusCode)
    );
  }

  /**
   * Oblicza opóźnienie dla kolejnej próby (exponential backoff with jitter)
   */
  private calculateRetryDelay(attempt: number, statusCode: number): number {
    // Dla rate limit, użyj większego opóźnienia
    const baseDelay =
      statusCode === 429 ? this.retryConfig.retryDelay * 2 : this.retryConfig.retryDelay;

    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelay * Math.pow(2, attempt);

    // Dodaj jitter (0-1000ms losowo)
    const jitter = Math.random() * 1000;

    return exponentialDelay + jitter;
  }

  /**
   * Parsuje Retry-After header
   */
  private parseRetryAfter(headers: Headers): number | undefined {
    const retryAfter = headers.get('Retry-After');
    if (!retryAfter) return undefined;

    const seconds = parseInt(retryAfter, 10);
    return isNaN(seconds) ? undefined : seconds;
  }

  /**
   * Pomocnicza funkcja sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parsuje odpowiedź z OpenRouter API
   */
  private parseResponse(
    apiResponse: OpenRouterAPIResponse
  ): OpenRouterChatResponse {
    if (!apiResponse.choices || apiResponse.choices.length === 0) {
      throw new OpenRouterParseError(
        'No choices in response',
        JSON.stringify(apiResponse)
      );
    }

    const choice = apiResponse.choices[0];

    if (!choice.message || !choice.message.content) {
      throw new OpenRouterParseError(
        'No content in response',
        JSON.stringify(apiResponse)
      );
    }

    return {
      id: apiResponse.id,
      model: apiResponse.model,
      content: choice.message.content,
      finishReason: choice.finish_reason,
      usage: {
        promptTokens: apiResponse.usage?.prompt_tokens || 0,
        completionTokens: apiResponse.usage?.completion_tokens || 0,
        totalTokens: apiResponse.usage?.total_tokens || 0,
      },
      created: apiResponse.created,
    };
  }

  /**
   * Waliduje messages przed wysłaniem
   */
  private validateMessages(messages: OpenRouterMessage[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new OpenRouterValidationError('Messages array cannot be empty');
    }

    const validRoles = ['system', 'user', 'assistant'];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (!msg.role || !validRoles.includes(msg.role)) {
        throw new OpenRouterValidationError(
          `Invalid role at message ${i}: ${msg.role}`
        );
      }

      if (!msg.content || typeof msg.content !== 'string') {
        throw new OpenRouterValidationError(
          `Invalid content at message ${i}: content must be a non-empty string`
        );
      }

      if (msg.content.trim().length === 0) {
        throw new OpenRouterValidationError(
          `Empty content at message ${i}`
        );
      }
    }

    // Sprawdź czy pierwsza wiadomość to system lub user
    const firstRole = messages[0].role;
    if (firstRole !== 'system' && firstRole !== 'user') {
      throw new OpenRouterValidationError(
        'First message must have role "system" or "user"'
      );
    }
  }

  /**
   * Waliduje response format
   */
  private validateResponseFormat(responseFormat: OpenRouterResponseFormat): void {
    if (responseFormat.type !== 'json_schema') {
      throw new OpenRouterValidationError(
        'Only "json_schema" response format is supported'
      );
    }

    const jsonSchema = responseFormat.json_schema;

    if (!jsonSchema.name || typeof jsonSchema.name !== 'string') {
      throw new OpenRouterValidationError(
        'response_format.json_schema.name is required'
      );
    }

    if (jsonSchema.strict !== true) {
      throw new OpenRouterValidationError(
        'response_format.json_schema.strict must be true for structured outputs'
      );
    }

    if (!jsonSchema.schema || typeof jsonSchema.schema !== 'object') {
      throw new OpenRouterValidationError(
        'response_format.json_schema.schema is required'
      );
    }

    if (jsonSchema.schema.type !== 'object') {
      throw new OpenRouterValidationError(
        'response_format.json_schema.schema.type must be "object"'
      );
    }

    if (!jsonSchema.schema.properties) {
      throw new OpenRouterValidationError(
        'response_format.json_schema.schema must have properties'
      );
    }

    // Sprawdź maksymalną głębokość zagnieżdżenia (max 5 poziomów)
    const maxDepth = 5;
    const depth = this.calculateSchemaDepth(jsonSchema.schema);
    if (depth > maxDepth) {
      throw new OpenRouterValidationError(
        `Schema nesting depth (${depth}) exceeds maximum allowed (${maxDepth})`
      );
    }
  }

  /**
   * Oblicza głębokość zagnieżdżenia schematu JSON
   */
  private calculateSchemaDepth(schema: any, currentDepth: number = 0): number {
    if (!schema || typeof schema !== 'object') {
      return currentDepth;
    }

    let maxDepth = currentDepth;

    if (schema.properties) {
      for (const key in schema.properties) {
        const propertyDepth = this.calculateSchemaDepth(
          schema.properties[key],
          currentDepth + 1
        );
        maxDepth = Math.max(maxDepth, propertyDepth);
      }
    }

    if (schema.items) {
      const itemsDepth = this.calculateSchemaDepth(
        schema.items,
        currentDepth + 1
      );
      maxDepth = Math.max(maxDepth, itemsDepth);
    }

    return maxDepth;
  }
}
```

### Krok 5: Refaktoryzacja Istniejącego Kodu

#### 5.1. Aktualizacja `generations.service.ts`

Zaktualizuj `src/lib/services/generations.service.ts` aby używał nowej usługi OpenRouter:

```typescript
// src/lib/services/generations.service.ts
import type { SupabaseClient } from '../../db/supabase.client';
import type {
  CreateGenerationDto,
  CreateGenerationResponseDto,
  ProposalDto,
} from '../../types';
import { OpenRouterService } from './openrouter.service';
import type { OpenRouterResponseFormat } from './openrouter.types';

/**
 * Struktura pojedynczej fiszki w odpowiedzi
 */
interface FlashcardProposal {
  front: string;
  back: string;
}

/**
 * Schemat JSON dla odpowiedzi z fiszkami
 */
const FLASHCARDS_RESPONSE_SCHEMA: OpenRouterResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'flashcards_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: {
                type: 'string',
                description: 'Question on the front of the flashcard (max 200 chars)',
              },
              back: {
                type: 'string',
                description: 'Answer on the back of the flashcard (max 500 chars)',
              },
            },
            required: ['front', 'back'],
            additionalProperties: false,
          },
          description: 'Array of flashcards (5-20 items)',
        },
      },
      required: ['flashcards'],
      additionalProperties: false,
    },
    description: 'Structured response containing flashcards generated from source text',
  },
};

/**
 * Prompt systemowy dla generowania fiszek
 */
const SYSTEM_PROMPT = `You are an expert educational content creator specialized in creating high-quality flashcards for spaced repetition learning.

Your task is to analyze the provided text and generate flashcards that:
1. Cover the most important concepts, facts, and relationships
2. Are clear, concise, and unambiguous
3. Have questions (front) that are specific and testable
4. Have answers (back) that are complete but concise
5. Follow best practices for spaced repetition (atomic concepts, one question per card)

Guidelines:
- Front: Maximum 200 characters, should be a clear question
- Back: Maximum 500 characters, should be a complete answer
- Generate between 5 and 20 flashcards depending on content complexity
- Focus on the most important and testable information`;

/**
 * Generuje unikatowy hash dla tekstu źródłowego
 */
async function generateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Wywołuje LLM przez OpenRouter w celu wygenerowania fiszek
 */
async function callLLM(
  sourceText: string,
  model: string,
  openRouterService: OpenRouterService
): Promise<FlashcardProposal[]> {
  const response = await openRouterService.chat({
    model,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Generate flashcards from this text:\n\n${sourceText}`,
      },
    ],
    params: {
      temperature: 0.7,
      max_tokens: 2000,
    },
    responseFormat: FLASHCARDS_RESPONSE_SCHEMA,
  });

  // Parsuj odpowiedź JSON
  try {
    const parsedContent = JSON.parse(response.content);
    const flashcards = parsedContent.flashcards as FlashcardProposal[];

    // Walidacja długości
    for (const card of flashcards) {
      if (card.front.length > 200) {
        card.front = card.front.substring(0, 197) + '...';
      }
      if (card.back.length > 500) {
        card.back = card.back.substring(0, 497) + '...';
      }
    }

    return flashcards;
  } catch (error) {
    throw new Error(
      `Failed to parse flashcards from LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Tworzy nową generację i zwraca propozycje fiszek
 */
export async function createGeneration(
  supabase: SupabaseClient,
  dto: CreateGenerationDto,
  userId: string,
  openRouterService: OpenRouterService
): Promise<CreateGenerationResponseDto> {
  // Krok 1: Generuj hash tekstu źródłowego
  const sourceTextHash = await generateTextHash(dto.sourceText);

  // Krok 2: Wywołaj LLM przez OpenRouter
  let flashcardProposals: FlashcardProposal[];
  let llmError: Error | null = null;

  try {
    flashcardProposals = await callLLM(dto.sourceText, dto.model, openRouterService);
  } catch (error) {
    llmError = error instanceof Error ? error : new Error('Unknown LLM error');
    flashcardProposals = [];
  }

  // Krok 3: Utwórz rekord generacji w bazie danych
  const { data: generation, error: insertError } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      model: dto.model,
      source_text_hash: sourceTextHash,
      source_text_length: dto.sourceText.length,
      generated_count: flashcardProposals.length,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
    })
    .select('id, model, generated_count')
    .single();

  if (insertError || !generation) {
    throw new Error(
      `Failed to create generation record: ${insertError?.message || 'Unknown error'}`
    );
  }

  // Krok 4: Jeśli wystąpił błąd LLM, zaloguj go
  if (llmError) {
    await supabase.from('generation_error_logs').insert({
      generation_id: generation.id,
      error_message: llmError.message,
      error_details: llmError.stack || null,
    });

    throw new Error(`Failed to generate flashcards: ${llmError.message}`);
  }

  // Krok 5: Transformuj propozycje na DTOs z unikalnymi ID
  const proposals: ProposalDto[] = flashcardProposals.map((card, index) => ({
    proposalId: `p-${generation.id}-${index}`,
    front: card.front,
    back: card.back,
  }));

  // Krok 6: Zwróć odpowiedź
  return {
    generationId: generation.id,
    model: generation.model,
    generatedCount: generation.generated_count,
    proposals,
  };
}
```

#### 5.2. Aktualizacja API Endpoint

Zaktualizuj `src/pages/api/generations.ts`:

```typescript
// src/pages/api/generations.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { CreateGenerationResponseDto } from '../../types';
import { createGeneration } from '../../lib/services/generations.service';
import { OpenRouterService } from '../../lib/services/openrouter.service';
import {
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterModelError,
  OpenRouterNetworkError,
  OpenRouterAPIError,
} from '../../lib/services/openrouter.errors';

export const prerender = false;

/**
 * Schemat walidacji dla requestu generacji
 */
const createGenerationSchema = z.object({
  sourceText: z
    .string()
    .min(1000, 'Source text must be at least 1000 characters')
    .max(10000, 'Source text must be at most 10000 characters'),
  model: z.string().min(1, 'Model is required').default('openai/gpt-4o-2024-08-06'),
});

/**
 * POST /api/generations
 * Tworzy nową generację wysyłając tekst źródłowy do LLM
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Krok 1: Sprawdź autoryzację
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Krok 2: Parsuj i waliduj request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = createGenerationSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const dto = validationResult.data;

    // Krok 3: Pobierz klucz API OpenRouter
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Service configuration error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Krok 4: Utwórz instancję usługi OpenRouter
    const openRouterService = new OpenRouterService({
      apiKey,
      defaultModel: 'openai/gpt-4o-2024-08-06',
      appInfo: {
        referer: 'https://10x-cards.app',
        title: '10x Cards',
      },
      timeout: 60000,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
      },
    });

    // Krok 5: Wywołaj serwis generacji
    try {
      const generationResponse = await createGeneration(
        locals.supabase,
        dto,
        userId,
        openRouterService
      );

      const response: CreateGenerationResponseDto = generationResponse;

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Obsługa błędów OpenRouter
      if (error instanceof OpenRouterAuthError) {
        console.error('OpenRouter auth error:', error.message);
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message: 'AI service configuration error',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (error instanceof OpenRouterRateLimitError) {
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'AI service rate limit exceeded. Please try again later.',
            retryAfter: error.retryAfter,
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (error instanceof OpenRouterModelError) {
        return new Response(
          JSON.stringify({
            error: 'Bad Request',
            message: `Model error: ${error.message}`,
            modelId: error.modelId,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (error instanceof OpenRouterNetworkError) {
        return new Response(
          JSON.stringify({
            error: 'Bad Gateway',
            message: 'Failed to communicate with AI service',
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (error instanceof OpenRouterAPIError) {
        return new Response(
          JSON.stringify({
            error: 'Bad Gateway',
            message: `AI service error: ${error.message}`,
            statusCode: error.statusCode,
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Inne błędy
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating generation:', error);

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to generate flashcards',
          details: errorMessage,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/generations:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Krok 6: Testowanie

#### 6.1. Testy Jednostkowe (Opcjonalne)

Utwórz plik `src/lib/services/openrouter.service.test.ts`:

```typescript
// src/lib/services/openrouter.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenRouterService } from './openrouter.service';
import {
  OpenRouterValidationError,
  OpenRouterAuthError,
} from './openrouter.errors';

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService({
      apiKey: 'test-api-key',
      defaultModel: 'openai/gpt-4',
    });
  });

  describe('constructor', () => {
    it('should throw error when API key is missing', () => {
      expect(() => {
        new OpenRouterService({ apiKey: '' });
      }).toThrow(OpenRouterValidationError);
    });

    it('should use default values when optional config is not provided', () => {
      const service = new OpenRouterService({ apiKey: 'test' });
      expect(service.config.baseUrl).toBe('https://openrouter.ai/api/v1');
      expect(service.config.timeout).toBe(60000);
    });
  });

  describe('validateMessages', () => {
    it('should throw error for empty messages array', async () => {
      await expect(
        service.chat({
          messages: [],
        })
      ).rejects.toThrow(OpenRouterValidationError);
    });

    it('should throw error for invalid role', async () => {
      await expect(
        service.chat({
          messages: [{ role: 'invalid' as any, content: 'test' }],
        })
      ).rejects.toThrow(OpenRouterValidationError);
    });

    it('should throw error for empty content', async () => {
      await expect(
        service.chat({
          messages: [{ role: 'user', content: '   ' }],
        })
      ).rejects.toThrow(OpenRouterValidationError);
    });
  });

  // Dodaj więcej testów...
});
```

#### 6.2. Test Manualny

Utwórz plik testowy `test-openrouter.ts`:

```typescript
// test-openrouter.ts
import { OpenRouterService } from './src/lib/services/openrouter.service';

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not found in environment');
    process.exit(1);
  }

  const service = new OpenRouterService({
    apiKey,
    defaultModel: 'openai/gpt-4o-2024-08-06',
    appInfo: {
      referer: 'https://10x-cards.app',
      title: '10x Cards Test',
    },
  });

  console.log('Testing basic chat...');

  try {
    const response = await service.chat({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Say hello!',
        },
      ],
      params: {
        temperature: 0.7,
        max_tokens: 100,
      },
    });

    console.log('✅ Basic chat successful');
    console.log('Response:', response.content);
    console.log('Tokens used:', response.usage.totalTokens);
  } catch (error) {
    console.error('❌ Basic chat failed:', error);
  }

  console.log('\nTesting structured output...');

  try {
    const response = await service.chat({
      model: 'openai/gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'Generate flashcards from user input.',
        },
        {
          role: 'user',
          content: 'Create 3 flashcards about TypeScript.',
        },
      ],
      params: {
        temperature: 0.7,
        max_tokens: 500,
      },
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'flashcards',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              flashcards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    front: { type: 'string' },
                    back: { type: 'string' },
                  },
                  required: ['front', 'back'],
                  additionalProperties: false,
                },
              },
            },
            required: ['flashcards'],
            additionalProperties: false,
          },
        },
      },
    });

    console.log('✅ Structured output successful');
    const flashcards = JSON.parse(response.content);
    console.log('Flashcards:', JSON.stringify(flashcards, null, 2));
  } catch (error) {
    console.error('❌ Structured output failed:', error);
  }

  console.log('\nTesting model listing...');

  try {
    const models = await service.getAvailableModels();
    console.log('✅ Model listing successful');
    console.log(`Found ${models.length} models`);
    console.log('Sample models:', models.slice(0, 3).map((m) => m.id));
  } catch (error) {
    console.error('❌ Model listing failed:', error);
  }
}

testOpenRouter();
```

Uruchom test:

```bash
# Dodaj do package.json w sekcji scripts:
"test:openrouter": "tsx test-openrouter.ts"

# Uruchom
npm run test:openrouter
```

### Krok 7: Dokumentacja i Eksport

#### 7.1. Utwórz Index File dla Eksportu

Utwórz `src/lib/services/openrouter.index.ts`:

```typescript
// src/lib/services/openrouter.index.ts

// Eksport głównej klasy usługi
export { OpenRouterService } from './openrouter.service';

// Eksport wszystkich typów
export type {
  OpenRouterServiceConfig,
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterMessage,
  OpenRouterRequestParams,
  OpenRouterResponseFormat,
  OpenRouterModel,
  OpenRouterAPIResponse,
  OpenRouterAPIRequestBody,
} from './openrouter.types';

// Eksport wszystkich błędów
export {
  OpenRouterError,
  OpenRouterValidationError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterModelError,
  OpenRouterAPIError,
  OpenRouterNetworkError,
  OpenRouterParseError,
} from './openrouter.errors';
```

#### 7.2. Aktualizuj AI Rules

Dodaj do `.ai/shared.mdc` sekcję o OpenRouter:

```markdown
## OpenRouter Service

Projekt używa własnej usługi OpenRouter (`src/lib/services/openrouter.service.ts`) do komunikacji z API OpenRouter.ai.

### Używanie Usługi

1. Importuj z index file:
```typescript
import { OpenRouterService } from '@/lib/services/openrouter.index';
```

2. Utwórz instancję z konfiguracją:
```typescript
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: 'openai/gpt-4o-2024-08-06',
  appInfo: {
    referer: 'https://10x-cards.app',
    title: '10x Cards',
  },
});
```

3. Wywołaj chat z messages i opcjonalnym response_format dla structured outputs:
```typescript
const response = await service.chat({
  messages: [...],
  responseFormat: { ... }, // opcjonalne
});
```

### Structured Outputs

Dla zapewnienia strukturalnych odpowiedzi JSON, użyj `responseFormat`:

```typescript
responseFormat: {
  type: 'json_schema',
  json_schema: {
    name: 'schema_name',
    strict: true,  // WYMAGANE
    schema: {
      type: 'object',
      properties: { ... },
      required: [...],
      additionalProperties: false,
    },
  },
}
```

### Obsługa Błędów

Usługa rzuca typowane błędy. Używaj try-catch z instanceof dla precyzyjnej obsługi:

```typescript
try {
  const response = await service.chat(request);
} catch (error) {
  if (error instanceof OpenRouterAuthError) {
    // Błąd autoryzacji
  } else if (error instanceof OpenRouterRateLimitError) {
    // Rate limit
  }
  // ... inne błędy
}
```
```

### Krok 8: Czyszczenie i Finalizacja

1. **Usuń stary kod** - Jeśli refaktoryzujesz, usuń stare funkcje `callLLM` z poprzedniej implementacji.

2. **Sprawdź lints**:
```bash
npm run lint
```

3. **Zbuduj projekt**:
```bash
npm run build
```

4. **Uruchom aplikację**:
```bash
npm run dev
```

5. **Przetestuj end-to-end** - Przetestuj pełny flow generowania fiszek przez interfejs aplikacji.

## Podsumowanie

Ten plan implementacji obejmuje:

✅ **Pełną usługę OpenRouter** z wszystkimi wymaganymi funkcjonalnościami  
✅ **Wsparcie dla structured outputs** przez `response_format` z JSON Schema  
✅ **Kompleksową obsługę błędów** z typowanymi wyjątkami  
✅ **Retry logic** z exponential backoff  
✅ **Walidację** parametrów i schematów  
✅ **Bezpieczeństwo** - prawidłowe zarządzanie kluczami API  
✅ **TypeScript** - pełne typowanie  
✅ **Zgodność z tech stack** - Astro 5, TypeScript 5  
✅ **Zgodność z coding practices** - clean code, error handling, early returns  

Usługa jest gotowa do użycia w projekcie 10x-cards i może być łatwo rozszerzona o dodatkowe funkcjonalności (np. streaming, embeddings) w przyszłości.

