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
    this.name = "OpenRouterError";

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
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "OpenRouterValidationError";
  }
}

/**
 * Błąd autoryzacji (invalid API key)
 */
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message = "Invalid API key") {
    super(message, "AUTH_ERROR", 401);
    this.name = "OpenRouterAuthError";
  }
}

/**
 * Błąd rate limit
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message = "Rate limit exceeded",
    public readonly retryAfter?: number
  ) {
    super(message, "RATE_LIMIT_ERROR", 429);
    this.name = "OpenRouterRateLimitError";
  }
}

/**
 * Błąd modelu (nieprawidłowa nazwa lub model niedostępny)
 */
export class OpenRouterModelError extends OpenRouterError {
  constructor(
    message: string,
    public readonly modelId?: string
  ) {
    super(message, "MODEL_ERROR", 400);
    this.name = "OpenRouterModelError";
  }
}

/**
 * Błąd API OpenRouter
 */
export class OpenRouterAPIError extends OpenRouterError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, "API_ERROR", statusCode, details);
    this.name = "OpenRouterAPIError";
  }
}

/**
 * Błąd sieci lub timeout
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message = "Network error or timeout") {
    super(message, "NETWORK_ERROR", 0);
    this.name = "OpenRouterNetworkError";
  }
}

/**
 * Błąd parsowania odpowiedzi
 */
export class OpenRouterParseError extends OpenRouterError {
  constructor(
    message: string,
    public readonly rawResponse?: string
  ) {
    super(message, "PARSE_ERROR", 0);
    this.name = "OpenRouterParseError";
  }
}
