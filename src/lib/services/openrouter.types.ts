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
  role: "system" | "user" | "assistant";
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
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: "object";
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
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
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
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: object;
      description?: string;
    };
  };
}
