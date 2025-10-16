# POST /api/flashcards - Usage Examples

## Quick Start

### Prerequisites
1. Zaloguj się i uzyskaj access token
2. Utwórz generation przez POST `/api/generations`
3. Zapisz `generationId` z odpowiedzi

### Basic Usage

```javascript
// JavaScript/TypeScript Example
const response = await fetch('http://localhost:4321/api/flashcards', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    generationId: 123,
    flashcards: [
      {
        front: 'What is the capital of France?',
        back: 'Paris',
        source: 'ai-full'
      },
      {
        front: 'What is 2 + 2?',
        back: '4',
        source: 'ai-edited'
      }
    ]
  })
});

const data = await response.json();

if (response.ok) {
  console.log('Created flashcards:', data.created);
  // Created flashcards: [
  //   { id: 1, front: 'What is the capital of France?', back: 'Paris' },
  //   { id: 2, front: 'What is 2 + 2?', back: '4' }
  // ]
} else {
  console.error('Error:', data);
}
```

## Complete Examples

### Example 1: AI-Generated Flashcards (Unedited)

```json
POST /api/flashcards
Authorization: Bearer eyJhbGc...

{
  "generationId": 42,
  "flashcards": [
    {
      "front": "What is photosynthesis?",
      "back": "The process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water.",
      "source": "ai-full"
    },
    {
      "front": "What is the function of mitochondria?",
      "back": "Mitochondria are the powerhouse of the cell, responsible for producing ATP through cellular respiration.",
      "source": "ai-full"
    }
  ]
}
```

**Response (201 Created)**:
```json
{
  "created": [
    {
      "id": 101,
      "front": "What is photosynthesis?",
      "back": "The process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water."
    },
    {
      "id": 102,
      "front": "What is the function of mitochondria?",
      "back": "Mitochondria are the powerhouse of the cell, responsible for producing ATP through cellular respiration."
    }
  ]
}
```

### Example 2: Mixed Sources (AI + Edited + Manual)

```json
POST /api/flashcards
Authorization: Bearer eyJhbGc...

{
  "generationId": 43,
  "flashcards": [
    {
      "front": "Capital of Spain?",
      "back": "Madrid",
      "source": "ai-full"
    },
    {
      "front": "What's the largest planet in our solar system?",
      "back": "Jupiter - it's over 11 times the diameter of Earth!",
      "source": "ai-edited"
    },
    {
      "front": "My custom question",
      "back": "My custom answer that I added myself",
      "source": "manual"
    }
  ]
}
```

### Example 3: Programming Concepts

```json
POST /api/flashcards
Authorization: Bearer eyJhbGc...

{
  "generationId": 44,
  "flashcards": [
    {
      "front": "What is a closure in JavaScript?",
      "back": "A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.",
      "source": "ai-full"
    },
    {
      "front": "What does 'REST' stand for?",
      "back": "Representational State Transfer - an architectural style for designing networked applications.",
      "source": "ai-full"
    },
    {
      "front": "What is the time complexity of binary search?",
      "back": "O(log n) - it divides the search space in half with each iteration.",
      "source": "ai-edited"
    }
  ]
}
```

## Error Handling Examples

### Example 4: Handling Validation Errors

```javascript
try {
  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      generationId: 1,
      flashcards: [
        {
          front: 'A'.repeat(250), // Too long!
          back: 'Answer',
          source: 'ai-full'
        }
      ]
    })
  });

  const data = await response.json();

  if (response.status === 400) {
    console.error('Validation errors:');
    data.details.forEach(error => {
      console.error(`- ${error.path}: ${error.message}`);
    });
    // Output:
    // - flashcards.0.front: Front must be at most 200 characters
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### Example 5: Handling Authentication Errors

```javascript
const response = await fetch('/api/flashcards', {
  method: 'POST',
  headers: {
    // Missing or invalid token
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    generationId: 1,
    flashcards: [{ front: 'Q', back: 'A', source: 'ai-full' }]
  })
});

if (response.status === 401) {
  const data = await response.json();
  console.error('Auth error:', data.message);
  // Redirect to login page
  window.location.href = '/login';
}
```

### Example 6: Handling Not Found (Wrong Generation)

```javascript
const response = await fetch('/api/flashcards', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    generationId: 999999, // Doesn't exist or belongs to another user
    flashcards: [{ front: 'Q', back: 'A', source: 'ai-full' }]
  })
});

if (response.status === 404) {
  const data = await response.json();
  console.error('Generation not found:', data.message);
  // Show error to user
  alert('The generation you\'re trying to use doesn\'t exist or doesn\'t belong to you.');
}
```

## React Hook Example

### Custom Hook for Creating Flashcards

```typescript
// hooks/useCreateFlashcards.ts
import { useState } from 'react';
import type { BulkCreateFlashcardsDto, BulkCreateFlashcardsResponseDto } from '@/types';

interface UseCreateFlashcardsResult {
  createFlashcards: (dto: BulkCreateFlashcardsDto) => Promise<BulkCreateFlashcardsResponseDto | null>;
  loading: boolean;
  error: string | null;
}

export function useCreateFlashcards(token: string): UseCreateFlashcardsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFlashcards = async (
    dto: BulkCreateFlashcardsDto
  ): Promise<BulkCreateFlashcardsResponseDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.details) {
          // Validation errors
          const errorMessages = data.details
            .map((e: any) => `${e.path}: ${e.message}`)
            .join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.message || 'Failed to create flashcards');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createFlashcards, loading, error };
}
```

### Using the Hook in a Component

```typescript
// components/FlashcardCreator.tsx
import { useCreateFlashcards } from '@/hooks/useCreateFlashcards';
import { useState } from 'react';

export function FlashcardCreator({ generationId, token }: Props) {
  const { createFlashcards, loading, error } = useCreateFlashcards(token);
  const [flashcards, setFlashcards] = useState([
    { front: '', back: '', source: 'ai-full' as const }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createFlashcards({
      generationId,
      flashcards: flashcards.filter(f => f.front && f.back)
    });

    if (result) {
      console.log('Created:', result.created.length, 'flashcards');
      // Success! Redirect or show success message
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {flashcards.map((card, index) => (
        <div key={index}>
          <input
            value={card.front}
            onChange={(e) => {
              const newCards = [...flashcards];
              newCards[index].front = e.target.value;
              setFlashcards(newCards);
            }}
            placeholder="Question (front)"
            maxLength={200}
          />
          <textarea
            value={card.back}
            onChange={(e) => {
              const newCards = [...flashcards];
              newCards[index].back = e.target.value;
              setFlashcards(newCards);
            }}
            placeholder="Answer (back)"
            maxLength={500}
          />
        </div>
      ))}

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Flashcards'}
      </button>

      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## Testing with Different Tools

### cURL

```bash
# Success case
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "generationId": 1,
    "flashcards": [
      {"front": "Q1", "back": "A1", "source": "ai-full"},
      {"front": "Q2", "back": "A2", "source": "ai-edited"}
    ]
  }'

# With pretty-printed JSON response
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "generationId": 1,
    "flashcards": [
      {"front": "Q1", "back": "A1", "source": "ai-full"}
    ]
  }' | jq
```

### HTTPie

```bash
# Success case
http POST localhost:4321/api/flashcards \
  Authorization:"Bearer YOUR_TOKEN_HERE" \
  generationId:=1 \
  flashcards:='[
    {"front": "Q1", "back": "A1", "source": "ai-full"}
  ]'
```

### Postman Collection

```json
{
  "info": {
    "name": "10x-cards API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Flashcards",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"generationId\": 1,\n  \"flashcards\": [\n    {\n      \"front\": \"Question 1\",\n      \"back\": \"Answer 1\",\n      \"source\": \"ai-full\"\n    }\n  ]\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/flashcards",
          "host": ["{{base_url}}"],
          "path": ["api", "flashcards"]
        }
      }
    }
  ]
}
```

## Edge Cases & Best Practices

### 1. Handling Large Batches

```javascript
// If you have more than 100 flashcards, split them into batches
async function createFlashcardsInBatches(generationId, allFlashcards, token) {
  const BATCH_SIZE = 100;
  const results = [];

  for (let i = 0; i < allFlashcards.length; i += BATCH_SIZE) {
    const batch = allFlashcards.slice(i, i + BATCH_SIZE);
    
    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ generationId, flashcards: batch })
    });

    const data = await response.json();
    if (response.ok) {
      results.push(...data.created);
    } else {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, data);
      break; // Stop on first failure
    }

    // Optional: add delay between batches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
```

### 2. Validating Before Sending

```typescript
import { z } from 'zod';

const flashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source: z.enum(['ai-full', 'ai-edited', 'manual']),
});

const bulkCreateSchema = z.object({
  generationId: z.number().int().positive(),
  flashcards: z.array(flashcardSchema).min(1).max(100),
});

function validateBeforeSending(dto: unknown) {
  const result = bulkCreateSchema.safeParse(dto);
  
  if (!result.success) {
    console.error('Client-side validation failed:');
    result.error.errors.forEach(err => {
      console.error(`- ${err.path.join('.')}: ${err.message}`);
    });
    return false;
  }
  
  return true;
}

// Usage
const dto = { generationId: 1, flashcards: [...] };
if (validateBeforeSending(dto)) {
  // Send request
}
```

### 3. Progress Tracking

```typescript
async function createFlashcardsWithProgress(
  generationId: number,
  flashcards: any[],
  token: string,
  onProgress: (current: number, total: number) => void
) {
  const BATCH_SIZE = 100;
  let completed = 0;
  const total = flashcards.length;

  for (let i = 0; i < flashcards.length; i += BATCH_SIZE) {
    const batch = flashcards.slice(i, i + BATCH_SIZE);
    
    await fetch('/api/flashcards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ generationId, flashcards: batch })
    });

    completed += batch.length;
    onProgress(completed, total);
  }
}

// Usage
await createFlashcardsWithProgress(1, myFlashcards, token, (current, total) => {
  console.log(`Progress: ${current}/${total} (${Math.round(current/total*100)}%)`);
});
```

---

**Last Updated**: 2025-10-16  
**For**: POST /api/flashcards endpoint  
**Related**: [API Documentation](flashcards-endpoint-documentation.md)

