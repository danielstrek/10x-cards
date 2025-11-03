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

    // Loguj informacje o requestcie (bez wrażliwych danych)
    console.log('[OpenRouter] Making request:', {
      endpoint,
      method,
      hasBody: !!body,
      model: body && typeof body === 'object' && 'model' in body ? body.model : 'unknown'
    });

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
          // Check if we should retry for retryable status codes
          const statusCode = response.status;
          const shouldRetry = this.shouldRetry(statusCode, attempt);
          
          if (shouldRetry) {
            // Store error info for retry
            try {
              const errorData = await response.json();
              const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
              console.error('[OpenRouter] HTTP Error:', {
                statusCode,
                errorMessage,
                attempt
              });
              lastError = new OpenRouterAPIError(errorMessage, statusCode, errorData);
            } catch {
              const errorMessage = await response.text();
              console.error('[OpenRouter] HTTP Error (text):', {
                statusCode,
                errorMessage,
                attempt
              });
              lastError = new OpenRouterAPIError(errorMessage, statusCode, errorMessage);
            }
            
            // Wait and retry
            const delay = this.calculateRetryDelay(attempt, statusCode);
            await this.sleep(delay);
            continue;
          }
          
          // Non-retryable error or max retries reached - throw immediately
          await this.handleHttpError(response, attempt);
        }

        // Parsuj odpowiedź
        const data = await response.json();
        return data as T;
      } catch (error) {
        // Re-throw if it's one of our custom errors (from handleHttpError)
        if (
          error instanceof OpenRouterAuthError ||
          error instanceof OpenRouterRateLimitError ||
          error instanceof OpenRouterModelError ||
          error instanceof OpenRouterAPIError ||
          error instanceof OpenRouterParseError ||
          error instanceof OpenRouterValidationError
        ) {
          throw error;
        }

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

    // Wszystkie próby zawiodły - throw the last error we stored
    if (lastError) {
      throw lastError;
    }
    throw new OpenRouterNetworkError('All retry attempts failed');
  }

  /**
   * Obsługuje błędy HTTP
   */
  private async handleHttpError(
    response: Response,
    attempt: number
  ): Promise<never> {
    const statusCode = response.status;
    let errorMessage: string;
    let errorDetails: unknown;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
      errorDetails = errorData;
      
      // Loguj szczegóły błędu dla debugowania (stringify dla pełnego podglądu)
      console.error('[OpenRouter] HTTP Error:', {
        statusCode,
        errorMessage,
        errorDetails: JSON.stringify(errorData, null, 2),
        metadata: errorData.error?.metadata,
        attempt
      });
    } catch {
      errorMessage = await response.text();
      errorDetails = errorMessage;
      
      console.error('[OpenRouter] HTTP Error (text):', {
        statusCode,
        errorMessage,
        attempt
      });
    }

    // Błąd autoryzacji - nie retry
    if (statusCode === 401 || statusCode === 403) {
      throw new OpenRouterAuthError(errorMessage);
    }

    // Błędy modelu
    if (statusCode === 400 && errorMessage.toLowerCase().includes('model')) {
      throw new OpenRouterModelError(errorMessage);
    }

    // Rate limit
    if (statusCode === 429) {
      const retryAfter = this.parseRetryAfter(response.headers);
      throw new OpenRouterRateLimitError(errorMessage, retryAfter);
    }

    // Błędy serwera - throw jako APIError
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

