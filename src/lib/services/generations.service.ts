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
 * Service for managing flashcard generation operations
 */

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
 * Generates a unique hash for the source text to detect duplicates
 */
async function generateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
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
 * 
 * @param supabase - Supabase client instance
 * @param dto - Data transfer object containing sourceText and model
 * @param userId - The authenticated user's ID
 * @param openRouterService - OpenRouter service instance
 * @returns Generation response with proposals
 * @throws Error if LLM call fails or database operation fails
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
  const startTime = Date.now();

  try {
    flashcardProposals = await callLLM(dto.sourceText, dto.model, openRouterService);
  } catch (error) {
    llmError = error instanceof Error ? error : new Error('Unknown LLM error');
    flashcardProposals = [];
  }

  const generationDuration = Date.now() - startTime;

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
      generation_duration: generationDuration,
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
      user_id: userId,
      model: dto.model,
      source_text_hash: sourceTextHash,
      source_text_length: dto.sourceText.length,
      error_code: 'LLM_GENERATION_ERROR',
      error_message: llmError.message,
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

