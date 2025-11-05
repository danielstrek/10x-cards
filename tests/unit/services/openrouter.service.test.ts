// tests/unit/services/openrouter.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import {
  OpenRouterValidationError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterModelError,
  OpenRouterAPIError,
  OpenRouterNetworkError,
  OpenRouterParseError,
} from "@/lib/services/openrouter.errors";
import type {
  OpenRouterServiceConfig,
  OpenRouterChatRequest,
  OpenRouterAPIResponse,
} from "@/lib/services/openrouter.types";

// Mock global fetch
global.fetch = vi.fn();

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  let mockFetch: Mock;

  const validConfig: OpenRouterServiceConfig = {
    apiKey: "test-api-key",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-2024-08-06",
    timeout: 5000,
    retryConfig: {
      maxRetries: 2,
      retryDelay: 100,
      retryableStatuses: [429, 500, 502, 503, 504],
    },
    appInfo: {
      referer: "https://10x-cards.app",
      title: "10x Cards",
    },
  };

  const mockSuccessResponse: OpenRouterAPIResponse = {
    id: "chatcmpl-123",
    model: "openai/gpt-4o-2024-08-06",
    choices: [
      {
        message: {
          role: "assistant",
          content: JSON.stringify({
            flashcards: [{ front: "What is React?", back: "A JavaScript library" }],
          }),
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
    created: Date.now(),
  };

  beforeEach(() => {
    mockFetch = global.fetch as Mock;
    mockFetch.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Constructor Validation", () => {
    it("should create service with valid config", () => {
      const service = new OpenRouterService(validConfig);

      expect(service).toBeInstanceOf(OpenRouterService);
      expect(service.config.apiKey).toBe(validConfig.apiKey);
      expect(service.config.baseUrl).toBe(validConfig.baseUrl);
    });

    it("should throw error when apiKey is missing", () => {
      expect(() => {
        new OpenRouterService({ apiKey: "" });
      }).toThrow(OpenRouterValidationError);

      expect(() => {
        new OpenRouterService({ apiKey: "" });
      }).toThrow("API key is required");
    });

    it("should use default baseUrl when not provided", () => {
      const service = new OpenRouterService({ apiKey: "test-key" });

      expect(service.config.baseUrl).toBe("https://openrouter.ai/api/v1");
    });

    it("should use default timeout when not provided", () => {
      const service = new OpenRouterService({ apiKey: "test-key" });

      expect(service.config.timeout).toBe(60000);
    });

    it("should use default retry config when not provided", () => {
      const service = new OpenRouterService({ apiKey: "test-key" });

      expect(service.config.retryConfig?.maxRetries).toBe(3);
      expect(service.config.retryConfig?.retryDelay).toBe(1000);
      expect(service.config.retryConfig?.retryableStatuses).toEqual([429, 500, 502, 503, 504]);
    });

    it("should accept custom retry config", () => {
      const customRetryConfig = {
        maxRetries: 5,
        retryDelay: 2000,
        retryableStatuses: [429, 500],
      };

      const service = new OpenRouterService({
        apiKey: "test-key",
        retryConfig: customRetryConfig,
      });

      expect(service.config.retryConfig?.maxRetries).toBe(5);
      expect(service.config.retryConfig?.retryDelay).toBe(2000);
      expect(service.config.retryConfig?.retryableStatuses).toEqual([429, 500]);
    });
  });

  describe("Message Validation", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should throw error for empty messages array", async () => {
      const request: OpenRouterChatRequest = {
        messages: [],
        model: "openai/gpt-4o-2024-08-06",
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow("Messages array cannot be empty");
    });

    it("should throw error for invalid role", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "invalid" as any, content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/Invalid role/);
    });

    it("should throw error for empty content", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/Invalid content/);
    });

    it("should throw error for whitespace-only content", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "   " }],
        model: "openai/gpt-4o-2024-08-06",
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/Empty content/);
    });

    it("should throw error when first message is assistant", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "assistant", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/First message must have role/);
    });

    it("should accept valid messages with system role first", async () => {
      const request: OpenRouterChatRequest = {
        messages: [
          { role: "system", content: "You are a helper" },
          { role: "user", content: "Hello" },
        ],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await expect(service.chat(request)).resolves.toBeDefined();
    });

    it("should accept valid messages with user role first", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await expect(service.chat(request)).resolves.toBeDefined();
    });
  });

  describe("Response Format Validation", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should throw error for non-json_schema type", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        responseFormat: {
          type: "json" as any,
        } as any,
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/Only "json_schema"/);
    });

    it("should throw error when json_schema.name is missing", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "",
            strict: true,
            schema: { type: "object", properties: {} },
          },
        },
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/name is required/);
    });

    it("should throw error when strict is not true", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "test",
            strict: false,
            schema: { type: "object", properties: {} },
          },
        },
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/strict must be true/);
    });

    it("should throw error when schema type is not object", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "test",
            strict: true,
            schema: { type: "array" as any, properties: {} },
          },
        },
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/type must be "object"/);
    });

    it("should throw error when schema has no properties", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "test",
            strict: true,
            schema: { type: "object", properties: undefined as any },
          },
        },
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/must have properties/);
    });

    it("should throw error when schema nesting exceeds max depth", async () => {
      const deepSchema = {
        type: "object" as const,
        properties: {
          level1: {
            type: "object",
            properties: {
              level2: {
                type: "object",
                properties: {
                  level3: {
                    type: "object",
                    properties: {
                      level4: {
                        type: "object",
                        properties: {
                          level5: {
                            type: "object",
                            properties: {
                              level6: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "deep_test",
            strict: true,
            schema: deepSchema,
          },
        },
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/nesting depth.*exceeds maximum/);
    });

    it("should accept valid json_schema format", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "flashcards_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      front: { type: "string" },
                      back: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await expect(service.chat(request)).resolves.toBeDefined();
    });
  });

  describe("Model Validation", () => {
    it("should throw error when no model specified", async () => {
      const service = new OpenRouterService({ apiKey: "test-key" }); // No default model

      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
      };

      await expect(service.chat(request)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.chat(request)).rejects.toThrow(/Model must be specified/);
    });

    it("should use model from request when provided", async () => {
      const service = new OpenRouterService({
        apiKey: "test-key",
        defaultModel: "openai/gpt-3.5-turbo",
      });

      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await service.chat(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("openai/gpt-4o-2024-08-06"),
        })
      );
    });

    it("should use default model when not provided in request", async () => {
      const service = new OpenRouterService({
        apiKey: "test-key",
        defaultModel: "openai/gpt-3.5-turbo",
      });

      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await service.chat(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("openai/gpt-3.5-turbo"),
        })
      );
    });
  });

  describe("HTTP Headers", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should include Authorization header with Bearer token", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await service.chat(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        })
      );
    });

    it("should include Content-Type header", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await service.chat(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should include app info headers when provided", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await service.chat(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "HTTP-Referer": "https://10x-cards.app",
            "X-Title": "10x Cards",
          }),
        })
      );
    });

    it("should not include app info headers when not provided", async () => {
      const serviceWithoutAppInfo = new OpenRouterService({
        apiKey: "test-key",
        defaultModel: "openai/gpt-4o-2024-08-06",
      });

      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await serviceWithoutAppInfo.chat(request);

      const headers = (mockFetch.mock.calls[0][1] as any).headers;
      expect(headers).not.toHaveProperty("HTTP-Referer");
      expect(headers).not.toHaveProperty("X-Title");
    });
  });

  describe("Successful API Call", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should return parsed response on success", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const response = await service.chat(request);

      expect(response).toBeDefined();
      expect(response.id).toBe("chatcmpl-123");
      expect(response.model).toBe("openai/gpt-4o-2024-08-06");
      expect(response.content).toContain("flashcards");
      expect(response.finishReason).toBe("stop");
      expect(response.usage.totalTokens).toBe(150);
    });

    it("should merge default params with request params", async () => {
      const serviceWithDefaults = new OpenRouterService({
        apiKey: "test-key",
        defaultModel: "openai/gpt-4o-2024-08-06",
        defaultParams: {
          temperature: 0.5,
          max_tokens: 1000,
        },
      });

      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        params: {
          temperature: 0.8, // Override default
          top_p: 0.9, // Additional param
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await serviceWithDefaults.chat(request);

      const requestBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(requestBody.temperature).toBe(0.8); // Overridden
      expect(requestBody.max_tokens).toBe(1000); // From default
      expect(requestBody.top_p).toBe(0.9); // From request
    });
  });

  describe("Error Handling - Authentication", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should throw OpenRouterAuthError on 401 status", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid API key" } }),
      });

      const error = await service.chat(request).catch((e) => e);
      expect(error).toBeInstanceOf(OpenRouterAuthError);
      expect(error.message).toContain("Invalid API key");
    });

    it("should throw OpenRouterAuthError on 403 status", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: "Forbidden" } }),
      });

      await expect(service.chat(request)).rejects.toBeInstanceOf(OpenRouterAuthError);
    });
  });

  describe("Error Handling - Rate Limiting", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should throw OpenRouterRateLimitError after max retries on 429", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      // Mock 3 failed attempts (initial + 2 retries)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: "Rate limit exceeded" } }),
        headers: new Headers(),
      });

      // Attach error handler immediately to avoid unhandled rejection
      const promise = service.chat(request).catch((e) => e);

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      const error = await promise;
      expect(error).toBeInstanceOf(OpenRouterRateLimitError);
      expect(error.message).toContain("Rate limit exceeded");

      // Should have tried 3 times (initial + 2 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should include retry-after value from header", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      const headers = new Headers();
      headers.set("Retry-After", "60");

      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: "Rate limit exceeded" } }),
        headers,
      });

      // Attach error handler immediately to avoid unhandled rejection
      const promise = service.chat(request).catch((e) => e);
      await vi.runAllTimersAsync();

      const error = await promise;
      expect(error).toBeInstanceOf(OpenRouterRateLimitError);
      expect((error as OpenRouterRateLimitError).retryAfter).toBe(60);
    });
  });

  describe("Error Handling - Model Errors", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should throw OpenRouterModelError for 400 with model in message", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "invalid-model",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: "Model not found: invalid-model" } }),
      });

      const error = await service.chat(request).catch((e) => e);
      expect(error).toBeInstanceOf(OpenRouterModelError);
      expect(error.message).toMatch(/Model not found/);
    });
  });

  describe("Error Handling - Network Errors", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should throw OpenRouterNetworkError on fetch failure", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockRejectedValue(new Error("Network failure"));

      // Attach error handler immediately to avoid unhandled rejection
      const promise = service.chat(request).catch((e) => e);
      await vi.runAllTimersAsync();

      const error = await promise;
      expect(error).toBeInstanceOf(OpenRouterNetworkError);
      expect(error.message).toMatch(/Network error/);
    });
  });

  describe("Error Handling - Server Errors with Retry", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should retry on 500 error and succeed", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      // First attempt fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: "Internal server error" } }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        });

      const promise = service.chat(request);
      await vi.runAllTimersAsync();

      const response = await promise;

      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw OpenRouterAPIError after max retries on 500", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Internal server error" } }),
        headers: new Headers(),
      });

      // Attach error handler immediately to avoid unhandled rejection
      const promise = service.chat(request).catch((e) => e);
      await vi.runAllTimersAsync();

      const error = await promise;
      expect(error).toBeInstanceOf(OpenRouterAPIError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("should retry on retryable status codes", async () => {
      const retryableStatuses = [429, 500, 502, 503, 504];

      for (const status of retryableStatuses) {
        mockFetch.mockClear();

        const request: OpenRouterChatRequest = {
          messages: [{ role: "user", content: "Hello" }],
          model: "openai/gpt-4o-2024-08-06",
        };

        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status,
            json: async () => ({ error: { message: `Error ${status}` } }),
            headers: new Headers(),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockSuccessResponse,
          });

        const promise = service.chat(request);
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toBeDefined();
        expect(mockFetch).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe("Response Parsing", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should throw OpenRouterParseError when no choices", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockSuccessResponse, choices: [] }),
      });

      const error = await service.chat(request).catch((e) => e);
      expect(error).toBeInstanceOf(OpenRouterParseError);
      expect(error.message).toMatch(/No choices in response/);
    });

    it("should throw OpenRouterParseError when no content", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSuccessResponse,
          choices: [{ message: { role: "assistant", content: "" }, finish_reason: "stop" }],
        }),
      });

      const error = await service.chat(request).catch((e) => e);
      expect(error).toBeInstanceOf(OpenRouterParseError);
      expect(error.message).toMatch(/No content in response/);
    });

    it("should handle response with missing usage data", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      const responseWithoutUsage = {
        ...mockSuccessResponse,
        usage: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutUsage,
      });

      const response = await service.chat(request);

      expect(response.usage.promptTokens).toBe(0);
      expect(response.usage.completionTokens).toBe(0);
      expect(response.usage.totalTokens).toBe(0);
    });
  });

  describe("Get Available Models", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should fetch and return available models", async () => {
      const mockModels = [
        {
          id: "openai/gpt-4o-2024-08-06",
          name: "GPT-4o",
          description: "Latest GPT-4 model",
          pricing: { prompt: "0.005", completion: "0.015" },
          context_length: 128000,
          architecture: {
            modality: "text",
            tokenizer: "GPT",
            instruct_type: "chat",
          },
          top_provider: {
            context_length: 128000,
            max_completion_tokens: 4096,
            is_moderated: true,
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockModels }),
      });

      const models = await service.getAvailableModels();

      expect(models).toEqual(mockModels);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/models",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("Retry Logic - Exponential Backoff", () => {
    beforeEach(() => {
      service = new OpenRouterService({
        ...validConfig,
        retryConfig: {
          maxRetries: 3,
          retryDelay: 1000,
          retryableStatuses: [500],
        },
      });
    });

    it("should use exponential backoff for retries", async () => {
      const request: OpenRouterChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-2024-08-06",
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Server error" } }),
        headers: new Headers(),
      });

      // Attach error handler immediately to avoid unhandled rejection
      const promise = service.chat(request).catch((e) => e);

      // First retry: ~1000ms + jitter
      await vi.advanceTimersByTimeAsync(1500);

      // Second retry: ~2000ms + jitter
      await vi.advanceTimersByTimeAsync(2500);

      // Third retry: ~4000ms + jitter
      await vi.advanceTimersByTimeAsync(4500);

      await vi.runAllTimersAsync();

      const error = await promise;
      expect(error).toBeInstanceOf(Error);
      expect(mockFetch).toHaveBeenCalledTimes(4); // initial + 3 retries
    });
  });
});
