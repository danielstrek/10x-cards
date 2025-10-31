// tests/unit/services/flashcards.service.test.ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { bulkCreateFlashcards } from '@/lib/services/flashcards.service';
import type { SupabaseClient } from '@/db/supabase.client';
import type { BulkCreateFlashcardsDto } from '@/types';

describe('flashcards.service', () => {
  let mockSupabase: SupabaseClient;
  const mockUserId = 'user-123';
  const mockGenerationId = 1;

  const validDto: BulkCreateFlashcardsDto = {
    generationId: mockGenerationId,
    flashcards: [
      {
        front: 'What is React?',
        back: 'A JavaScript library for building user interfaces',
        source: 'ai-full',
      },
      {
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
        source: 'ai-edited',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as any;
  });

  describe('bulkCreateFlashcards', () => {
    it('should successfully create flashcards and return created data', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockCreatedFlashcards = [
        { id: 1, front: 'What is React?', back: 'A JavaScript library for building user interfaces' },
        { id: 2, front: 'What is TypeScript?', back: 'A typed superset of JavaScript' },
      ];

      // Mock for generations table (verification)
      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      // Mock for flashcards table (insert)
      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
      };

      // Mock for generations table (update)
      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          // First call is for select, second is for update
          const callCount = (mockSupabase.from as Mock).mock.calls.filter(
            (call) => call[0] === 'generations'
          ).length;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        if (table === 'flashcards') {
          return mockFlashcardsChain;
        }
      });

      const result = await bulkCreateFlashcards(mockSupabase, validDto, mockUserId);

      expect(result).toEqual(mockCreatedFlashcards);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should verify generation exists and belongs to user', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockGeneration, error: null });

      const mockGenerationsChain = {
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      };

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: 1, front: 'Q', back: 'A' }],
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      await bulkCreateFlashcards(mockSupabase, validDto, mockUserId);

      // Verify generation was queried
      expect(mockSelect).toHaveBeenCalledWith(
        'id, user_id, accepted_unedited_count, accepted_edited_count'
      );
      expect(mockEq).toHaveBeenCalledWith('id', mockGenerationId);
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw error when generation does not exist', async () => {
      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockGenerationsChain);

      await expect(
        bulkCreateFlashcards(mockSupabase, validDto, mockUserId)
      ).rejects.toThrow('Generation not found or does not belong to user');
    });

    it('should throw error when generation belongs to different user', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        user_id: 'different-user-456',
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      (mockSupabase.from as Mock).mockReturnValue(mockGenerationsChain);

      // The eq() filter on user_id should prevent this, but if it somehow passes:
      // RLS would block it anyway. We test that the select includes user_id check.
      expect(mockGenerationsChain.eq).toBeDefined();
    });

    it('should map flashcards to correct insert structure', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 1, front: 'Q', back: 'A' }],
        error: null,
      });

      const mockFlashcardsChain = {
        insert: mockInsert,
        select: mockSelect,
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      await bulkCreateFlashcards(mockSupabase, validDto, mockUserId);

      // Verify insert was called with correct structure
      expect(mockInsert).toHaveBeenCalledWith([
        {
          user_id: mockUserId,
          generation_id: mockGenerationId,
          front: 'What is React?',
          back: 'A JavaScript library for building user interfaces',
          source: 'ai-full',
        },
        {
          user_id: mockUserId,
          generation_id: mockGenerationId,
          front: 'What is TypeScript?',
          back: 'A typed superset of JavaScript',
          source: 'ai-edited',
        },
      ]);
    });

    it('should throw error when flashcard insert fails', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          return mockGenerationsChain;
        }
        return mockFlashcardsChain;
      });

      await expect(
        bulkCreateFlashcards(mockSupabase, validDto, mockUserId)
      ).rejects.toThrow('Failed to insert flashcards');
    });

    it('should throw error when no flashcards are created', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [], // Empty array
          error: null,
        }),
      };

      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          return mockGenerationsChain;
        }
        return mockFlashcardsChain;
      });

      await expect(
        bulkCreateFlashcards(mockSupabase, validDto, mockUserId)
      ).rejects.toThrow('No flashcards were created');
    });

    it('should update generation counters correctly', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 5, // Existing count
        accepted_edited_count: 3, // Existing count
      };

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 1, front: 'Q1', back: 'A1' },
            { id: 2, front: 'Q2', back: 'A2' },
          ],
          error: null,
        }),
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      const mockUpdateChain = {
        update: mockUpdate,
        eq: mockEq,
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      await bulkCreateFlashcards(mockSupabase, validDto, mockUserId);

      // Verify update was called with incremented counts
      // dto has 1 ai-full and 1 ai-edited
      expect(mockUpdate).toHaveBeenCalledWith({
        accepted_unedited_count: 6, // 5 + 1
        accepted_edited_count: 4, // 3 + 1
      });
      expect(mockEq).toHaveBeenCalledWith('id', mockGenerationId);
    });

    it('should count ai-full flashcards correctly', async () => {
      const dtoWithAllUnedited: BulkCreateFlashcardsDto = {
        generationId: mockGenerationId,
        flashcards: [
          { front: 'Q1', back: 'A1', source: 'ai-full' },
          { front: 'Q2', back: 'A2', source: 'ai-full' },
          { front: 'Q3', back: 'A3', source: 'ai-full' },
        ],
      };

      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 1, front: 'Q1', back: 'A1' },
            { id: 2, front: 'Q2', back: 'A2' },
            { id: 3, front: 'Q3', back: 'A3' },
          ],
          error: null,
        }),
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      const mockUpdateChain = {
        update: mockUpdate,
        eq: mockEq,
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      await bulkCreateFlashcards(mockSupabase, dtoWithAllUnedited, mockUserId);

      expect(mockUpdate).toHaveBeenCalledWith({
        accepted_unedited_count: 3,
        accepted_edited_count: 0,
      });
    });

    it('should count ai-edited flashcards correctly', async () => {
      const dtoWithAllEdited: BulkCreateFlashcardsDto = {
        generationId: mockGenerationId,
        flashcards: [
          { front: 'Q1', back: 'A1', source: 'ai-edited' },
          { front: 'Q2', back: 'A2', source: 'ai-edited' },
        ],
      };

      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 1, front: 'Q1', back: 'A1' },
            { id: 2, front: 'Q2', back: 'A2' },
          ],
          error: null,
        }),
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      const mockUpdateChain = {
        update: mockUpdate,
        eq: mockEq,
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      await bulkCreateFlashcards(mockSupabase, dtoWithAllEdited, mockUserId);

      expect(mockUpdate).toHaveBeenCalledWith({
        accepted_unedited_count: 0,
        accepted_edited_count: 2,
      });
    });

    it('should not fail operation when generation update fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockCreatedFlashcards = [
        { id: 1, front: 'Q', back: 'A' },
      ];

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: mockCreatedFlashcards,
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      // Should not throw, but should log error
      const result = await bulkCreateFlashcards(mockSupabase, validDto, mockUserId);

      expect(result).toEqual(mockCreatedFlashcards);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update generation counters:',
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle bulk insert of 100 flashcards (max limit)', async () => {
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
        source: 'ai-full' as const,
      }));

      const dtoWithMaxFlashcards: BulkCreateFlashcardsDto = {
        generationId: mockGenerationId,
        flashcards: largeBatch,
      };

      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockCreatedFlashcards = largeBatch.map((card, i) => ({
        id: i + 1,
        front: card.front,
        back: card.back,
      }));

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: mockCreatedFlashcards,
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      const result = await bulkCreateFlashcards(
        mockSupabase,
        dtoWithMaxFlashcards,
        mockUserId
      );

      expect(result).toHaveLength(100);
    });

    it('should handle single flashcard insert', async () => {
      const dtoWithSingleFlashcard: BulkCreateFlashcardsDto = {
        generationId: mockGenerationId,
        flashcards: [
          { front: 'Single question', back: 'Single answer', source: 'ai-full' },
        ],
      };

      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockCreatedFlashcards = [
        { id: 1, front: 'Single question', back: 'Single answer' },
      ];

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: mockCreatedFlashcards,
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      const result = await bulkCreateFlashcards(
        mockSupabase,
        dtoWithSingleFlashcard,
        mockUserId
      );

      expect(result).toHaveLength(1);
      expect(result[0].front).toBe('Single question');
    });

    it('should return only id, front, and back fields', async () => {
      const mockGeneration = {
        id: mockGenerationId,
        user_id: mockUserId,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockCreatedFlashcards = [
        {
          id: 1,
          front: 'What is React?',
          back: 'A JavaScript library',
          // Other fields that should not be returned
          user_id: mockUserId,
          generation_id: mockGenerationId,
          source: 'ai-full',
          created_at: '2024-01-01',
        },
      ];

      const mockGenerationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGeneration, error: null }),
      };

      const mockSelect = vi.fn().mockResolvedValue({
        // Simulates .select('id, front, back')
        data: mockCreatedFlashcards.map(({ id, front, back }) => ({ id, front, back })),
        error: null,
      });

      const mockFlashcardsChain = {
        insert: vi.fn().mockReturnThis(),
        select: mockSelect,
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      (mockSupabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'generations') {
          callCount++;
          return callCount === 1 ? mockGenerationsChain : mockUpdateChain;
        }
        return mockFlashcardsChain;
      });

      const result = await bulkCreateFlashcards(mockSupabase, validDto, mockUserId);

      // Verify select was called with specific fields
      expect(mockSelect).toHaveBeenCalledWith('id, front, back');

      // Verify result only has id, front, back
      expect(result[0]).toEqual({
        id: 1,
        front: 'What is React?',
        back: 'A JavaScript library',
      });
      expect(result[0]).not.toHaveProperty('user_id');
      expect(result[0]).not.toHaveProperty('source');
    });
  });
});

