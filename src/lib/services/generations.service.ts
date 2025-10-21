// src/lib/services/generations.service.ts
import type { SupabaseClient } from '../../db/supabase.client';
import type {
  CreateGenerationDto,
  CreateGenerationResponseDto,
  ProposalDto,
} from '../../types';

/**
 * Service for managing flashcard generation operations
 */

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
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
}

interface FlashcardProposal {
  front: string;
  back: string;
}

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
 * Calls OpenRouter API to generate flashcard proposals
 */
async function callLLM(
  sourceText: string,
  model: string,
  apiKey: string
): Promise<FlashcardProposal[]> {
  const systemPrompt = `You are an expert educational content creator specialized in creating high-quality flashcards for spaced repetition learning.

Your task is to analyze the provided text and generate flashcards that:
1. Cover the most important concepts, facts, and relationships
2. Are clear, concise, and unambiguous
3. Have questions (front) that are specific and testable
4. Have answers (back) that are complete but concise
5. Follow best practices for spaced repetition (atomic concepts, one question per card)

Return ONLY a valid JSON array of flashcards in this exact format:
[
  {"front": "Question text here?", "back": "Answer text here."},
  {"front": "Another question?", "back": "Another answer."}
]

Guidelines:
- Front: Maximum 200 characters, should be a clear question
- Back: Maximum 500 characters, should be a complete answer
- Generate between 5 and 20 flashcards depending on content
- Do not include any text outside the JSON array
- Ensure proper JSON formatting with double quotes`;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate flashcards from this text:\n\n${sourceText}` },
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://10x-cards.app', // Optional but recommended
      'X-Title': '10x Cards', // Optional but recommended
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from LLM');
  }

  const content = data.choices[0].message.content;

  // Parse the JSON response
  try {
    // Try to extract JSON array from the response (in case there's extra text)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    
    const flashcards = JSON.parse(jsonContent) as FlashcardProposal[];

    // Validate the flashcards
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Invalid flashcard format: expected non-empty array');
    }

    // Validate each flashcard
    for (const card of flashcards) {
      if (!card.front || !card.back) {
        throw new Error('Invalid flashcard: missing front or back');
      }
      if (typeof card.front !== 'string' || typeof card.back !== 'string') {
        throw new Error('Invalid flashcard: front and back must be strings');
      }
      if (card.front.length > 200) {
        card.front = card.front.substring(0, 200);
      }
      if (card.back.length > 500) {
        card.back = card.back.substring(0, 500);
      }
    }

    return flashcards;
  } catch (error) {
    console.error('Failed to parse LLM response:', content);
    throw new Error(`Failed to parse flashcards from LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a new generation and returns flashcard proposals
 * 
 * @param supabase - Supabase client instance
 * @param dto - Data transfer object containing sourceText and model
 * @param userId - The authenticated user's ID
 * @param apiKey - OpenRouter API key
 * @returns Generation response with proposals
 * @throws Error if LLM call fails or database operation fails
 */
export async function createGeneration(
  supabase: SupabaseClient,
  dto: CreateGenerationDto,
  userId: string,
  apiKey: string
): Promise<CreateGenerationResponseDto> {
  // Step 1: Generate hash for source text
  const sourceTextHash = await generateTextHash(dto.sourceText);

  // Step 2: Call LLM to generate flashcard proposals
  let flashcardProposals: FlashcardProposal[];
  let llmError: Error | null = null;

  try {
    flashcardProposals = await callLLM(dto.sourceText, dto.model, apiKey);
  } catch (error) {
    llmError = error instanceof Error ? error : new Error('Unknown LLM error');
    flashcardProposals = [];
  }

  // Step 3: Create generation record in database
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
    throw new Error(`Failed to create generation record: ${insertError?.message || 'Unknown error'}`);
  }

  // Step 4: If LLM call failed, log the error
  if (llmError) {
    // Log error to generation_error_logs table
    await supabase
      .from('generation_error_logs')
      .insert({
        generation_id: generation.id,
        error_message: llmError.message,
        error_details: llmError.stack || null,
      });

    // Re-throw the error
    throw new Error(`Failed to generate flashcards: ${llmError.message}`);
  }

  // Step 5: Transform proposals to DTOs with unique IDs
  const proposals: ProposalDto[] = flashcardProposals.map((card, index) => ({
    proposalId: `p-${generation.id}-${index}`,
    front: card.front,
    back: card.back,
  }));

  // Step 6: Return response
  return {
    generationId: generation.id,
    model: generation.model,
    generatedCount: generation.generated_count,
    proposals: proposals,
  };
}

