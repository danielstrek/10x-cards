// tests/unit/services/generations.service.test.ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { createGeneration } from '@/lib/services/generations.service';
import { OpenRouterService } from '@/lib/services/openrouter.service';
import type { SupabaseClient } from '@/db/supabase.client';
import type { CreateGenerationDto } from '@/types';

// Mock OpenRouterService
vi.mock('@/lib/services/openrouter.service');

// Mock crypto.subtle for text hashing
const mockDigest = vi.fn();
vi.stubGlobal('crypto', {
  subtle: {
    digest: mockDigest,
  },
});

describe('generations.service', () => {
  let mockSupabase: SupabaseClient;
  let mockOpenRouterService: OpenRouterService;

  const mockUserId = 'user-123';
  const mockGenerationId = 1;

  const validDto: CreateGenerationDto = {
    sourceText: 'a'.repeat(1000), // 1000 characters
    model: 'openai/gpt-4o-2024-08-06',
  };

  const mockFlashcardsResponse = [
    {
      front: 'What is React?',
      back: 'A JavaScript library for building user interfaces',
    },
    {
      front: 'What is TypeScript?',
      back: 'A typed superset of JavaScript',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as any;

    // Mock OpenRouter service
    mockOpenRouterService = {
      chat: vi.fn(),
    } as any;

    // Mock crypto.subtle.digest
    mockDigest.mockResolvedValue(
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer
    );
  });

  describe('createGeneration', () => {
    it('should successfully create generation with flashcard proposals', async () => {
      // Setup mocks
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 2,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
      });

      // Execute
      const result = await createGeneration(
        mockSupabase,
        validDto,
        mockUserId,
        mockOpenRouterService
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.generationId).toBe(mockGenerationId);
      expect(result.model).toBe(validDto.model);
      expect(result.generatedCount).toBe(2);
      expect(result.proposals).toHaveLength(2);
      expect(result.proposals[0].front).toBe('What is React?');
      expect(result.proposals[0].proposalId).toBe(`p-${mockGenerationId}-0`);
    });

    it('should generate text hash using SHA-256', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 2,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
      });

      await createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService);

      // Verify crypto.subtle.digest was called with SHA-256
      expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
    });

    it('should call OpenRouter with system prompt and user text', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 2,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
      });

      await createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService);

      // Verify OpenRouter chat was called with correct structure
      expect(mockOpenRouterService.chat).toHaveBeenCalledWith({
        model: validDto.model,
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('expert educational content creator'),
          },
          {
            role: 'user',
            content: expect.stringContaining(validDto.sourceText),
          },
        ],
        params: {
          temperature: 0.7,
          max_tokens: 2000,
        },
        responseFormat: expect.objectContaining({
          type: 'json_schema',
        }),
      });
    });

    it('should insert generation record with correct data', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 2,
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockGeneration, error: null });

      const mockFromChain = {
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
      });

      await createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService);

      // Verify insert was called with correct structure
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        model: validDto.model,
        source_text_hash: expect.any(String),
        source_text_length: validDto.sourceText.length,
        generated_count: 2,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
        generation_duration: expect.any(Number),
      });
    });

    it('should measure and store generation duration', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 2,
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockGeneration, error: null });

      const mockFromChain = {
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      // Simulate a delay in OpenRouter response
      (mockOpenRouterService.chat as Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
        };
      });

      await createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService);

      // Verify generation_duration is a positive number
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.generation_duration).toBeGreaterThan(0);
    });

    it('should truncate flashcard front if exceeds 200 characters', async () => {
      const longFront = 'a'.repeat(250);
      const mockFlashcardsWithLongFront = [
        {
          front: longFront,
          back: 'A normal answer',
        },
      ];

      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 1,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsWithLongFront }),
      });

      const result = await createGeneration(
        mockSupabase,
        validDto,
        mockUserId,
        mockOpenRouterService
      );

      expect(result.proposals[0].front).toHaveLength(200);
      expect(result.proposals[0].front.endsWith('...')).toBe(true);
    });

    it('should truncate flashcard back if exceeds 500 characters', async () => {
      const longBack = 'a'.repeat(550);
      const mockFlashcardsWithLongBack = [
        {
          front: 'Question',
          back: longBack,
        },
      ];

      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 1,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsWithLongBack }),
      });

      const result = await createGeneration(
        mockSupabase,
        validDto,
        mockUserId,
        mockOpenRouterService
      );

      expect(result.proposals[0].back).toHaveLength(500);
      expect(result.proposals[0].back.endsWith('...')).toBe(true);
    });

    it('should create unique proposal IDs based on generation ID and index', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 2,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
      });

      const result = await createGeneration(
        mockSupabase,
        validDto,
        mockUserId,
        mockOpenRouterService
      );

      expect(result.proposals[0].proposalId).toBe('p-1-0');
      expect(result.proposals[1].proposalId).toBe('p-1-1');
    });

    it('should throw error when LLM call fails', async () => {
      const mockError = new Error('OpenRouter API error');

      (mockOpenRouterService.chat as Mock).mockRejectedValue(mockError);

      await expect(
        createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService)
      ).rejects.toThrow('Failed to generate flashcards');
    });

    it('should log error to generation_error_logs when LLM fails', async () => {
      const mockError = new Error('OpenRouter API error');

      const mockGenerationsInsert = vi.fn().mockReturnThis();
      const mockGenerationsSelect = vi.fn().mockReturnThis();
      const mockGenerationsSingle = vi.fn().mockResolvedValue({
        data: {
          id: mockGenerationId,
          model: validDto.model,
          generated_count: 0,
        },
        error: null,
      });

      const mockErrorLogsInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          return {
            insert: mockGenerationsInsert,
            select: mockGenerationsSelect,
            single: mockGenerationsSingle,
          };
        }
        if (table === 'generation_error_logs') {
          return {
            insert: mockErrorLogsInsert,
          };
        }
      });

      (mockOpenRouterService.chat as Mock).mockRejectedValue(mockError);

      await expect(
        createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService)
      ).rejects.toThrow();

      // Verify error was logged
      expect(mockErrorLogsInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        model: validDto.model,
        source_text_hash: expect.any(String),
        source_text_length: validDto.sourceText.length,
        error_code: 'LLM_GENERATION_ERROR',
        error_message: 'OpenRouter API error',
      });
    });

    it('should throw error when generation insert fails', async () => {
      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
      });

      await expect(
        createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService)
      ).rejects.toThrow('Failed to create generation record');
    });

    it('should throw error when LLM response is not valid JSON', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 0,
      };

      const mockGenerationsInsert = vi.fn().mockReturnThis();
      const mockGenerationsSelect = vi.fn().mockReturnThis();
      const mockGenerationsSingle = vi.fn().mockResolvedValue({
        data: mockGeneration,
        error: null,
      });

      const mockErrorLogsInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          return {
            insert: mockGenerationsInsert,
            select: mockGenerationsSelect,
            single: mockGenerationsSingle,
          };
        }
        if (table === 'generation_error_logs') {
          return {
            insert: mockErrorLogsInsert,
          };
        }
      });

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: 'invalid json response',
      });

      await expect(
        createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService)
      ).rejects.toThrow();
    });

    it('should handle empty flashcards array from LLM', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 0,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: [] }),
      });

      const result = await createGeneration(
        mockSupabase,
        validDto,
        mockUserId,
        mockOpenRouterService
      );

      expect(result.proposals).toHaveLength(0);
      expect(result.generatedCount).toBe(0);
    });

    it('should handle multiple flashcards (5-20 range)', async () => {
      const manyFlashcards = Array.from({ length: 15 }, (_, i) => ({
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
      }));

      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 15,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: manyFlashcards }),
      });

      const result = await createGeneration(
        mockSupabase,
        validDto,
        mockUserId,
        mockOpenRouterService
      );

      expect(result.proposals).toHaveLength(15);
      expect(result.generatedCount).toBe(15);
    });

    it('should properly structure response DTO', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 2,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
      });

      const result = await createGeneration(
        mockSupabase,
        validDto,
        mockUserId,
        mockOpenRouterService
      );

      // Verify response structure matches CreateGenerationResponseDto
      expect(result).toEqual({
        generationId: expect.any(Number),
        model: expect.any(String),
        generatedCount: expect.any(Number),
        proposals: expect.arrayContaining([
          expect.objectContaining({
            proposalId: expect.any(String),
            front: expect.any(String),
            back: expect.any(String),
          }),
        ]),
      });
    });

    it('should use response_format with strict json_schema', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        model: validDto.model,
        generated_count: 2,
      };

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockFromChain);

      (mockOpenRouterService.chat as Mock).mockResolvedValue({
        content: JSON.stringify({ flashcards: mockFlashcardsResponse }),
      });

      await createGeneration(mockSupabase, validDto, mockUserId, mockOpenRouterService);

      // Verify responseFormat structure
      const chatCall = (mockOpenRouterService.chat as Mock).mock.calls[0][0];
      expect(chatCall.responseFormat).toEqual({
        type: 'json_schema',
        json_schema: {
          name: 'flashcards_response',
          strict: true,
          schema: expect.objectContaining({
            type: 'object',
            properties: expect.objectContaining({
              flashcards: expect.any(Object),
            }),
            required: ['flashcards'],
            additionalProperties: false,
          }),
        },
      });
    });
  });
});

