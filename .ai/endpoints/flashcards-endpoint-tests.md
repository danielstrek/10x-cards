# POST /api/flashcards - Test Scenarios

> **Note**: Te testy są przygotowane jako dokumentacja i przykłady.  
> Do uruchomienia wymagana jest konfiguracja środowiska testowego (Vitest + Test Database).

## Test Structure Overview

```
tests/
├── unit/
│   ├── services/
│   │   └── flashcards.service.test.ts
│   └── validators/
│       └── flashcards.validator.test.ts
└── integration/
    └── api/
        └── flashcards.test.ts
```

## Unit Tests

### 1. Zod Schema Validation Tests

```typescript
// tests/unit/validators/flashcards.validator.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schema from src/pages/api/flashcards.ts
const flashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
});

const bulkCreateFlashcardsSchema = z.object({
  generationId: z.number().int().positive(),
  flashcards: z.array(flashcardSchema).min(1).max(100),
});

describe("Bulk Create Flashcards Schema", () => {
  describe("Valid inputs", () => {
    it("should accept valid flashcard data", () => {
      const validData = {
        generationId: 123,
        flashcards: [
          { front: "Q1", back: "A1", source: "ai-full" as const },
          { front: "Q2", back: "A2", source: "ai-edited" as const },
        ],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept flashcard with max length strings", () => {
      const validData = {
        generationId: 1,
        flashcards: [
          {
            front: "A".repeat(200), // Exactly 200 chars
            back: "B".repeat(500), // Exactly 500 chars
            source: "manual" as const,
          },
        ],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept up to 100 flashcards", () => {
      const flashcards = Array(100)
        .fill(null)
        .map((_, i) => ({
          front: `Question ${i}`,
          back: `Answer ${i}`,
          source: "ai-full" as const,
        }));

      const validData = { generationId: 1, flashcards };
      const result = bulkCreateFlashcardsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid generationId", () => {
    it("should reject negative generationId", () => {
      const invalidData = {
        generationId: -1,
        flashcards: [{ front: "Q", back: "A", source: "ai-full" }],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject zero generationId", () => {
      const invalidData = {
        generationId: 0,
        flashcards: [{ front: "Q", back: "A", source: "ai-full" }],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer generationId", () => {
      const invalidData = {
        generationId: 1.5,
        flashcards: [{ front: "Q", back: "A", source: "ai-full" }],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("Invalid flashcards array", () => {
    it("should reject empty flashcards array", () => {
      const invalidData = {
        generationId: 1,
        flashcards: [],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at least");
      }
    });

    it("should reject more than 100 flashcards", () => {
      const flashcards = Array(101)
        .fill(null)
        .map(() => ({
          front: "Q",
          back: "A",
          source: "ai-full" as const,
        }));

      const invalidData = { generationId: 1, flashcards };
      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("Invalid front field", () => {
    it("should reject empty front string", () => {
      const invalidData = {
        generationId: 1,
        flashcards: [{ front: "", back: "A", source: "ai-full" }],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject front longer than 200 characters", () => {
      const invalidData = {
        generationId: 1,
        flashcards: [{ front: "A".repeat(201), back: "Answer", source: "ai-full" }],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("200");
      }
    });
  });

  describe("Invalid back field", () => {
    it("should reject empty back string", () => {
      const invalidData = {
        generationId: 1,
        flashcards: [{ front: "Q", back: "", source: "ai-full" }],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject back longer than 500 characters", () => {
      const invalidData = {
        generationId: 1,
        flashcards: [{ front: "Question", back: "A".repeat(501), source: "ai-full" }],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("500");
      }
    });
  });

  describe("Invalid source field", () => {
    it("should reject invalid source value", () => {
      const invalidData = {
        generationId: 1,
        flashcards: [{ front: "Q", back: "A", source: "invalid-source" }],
      };

      const result = bulkCreateFlashcardsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept only valid source values", () => {
      const validSources = ["ai-full", "ai-edited", "manual"] as const;

      validSources.forEach((source) => {
        const data = {
          generationId: 1,
          flashcards: [{ front: "Q", back: "A", source }],
        };
        const result = bulkCreateFlashcardsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});
```

### 2. Service Layer Tests

```typescript
// tests/unit/services/flashcards.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { bulkCreateFlashcards } from "@/lib/services/flashcards.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock Supabase client
const createMockSupabase = () => {
  const mock = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    single: vi.fn(() => mock),
  };
  return mock as unknown as SupabaseClient;
};

describe("bulkCreateFlashcards Service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe("Success scenarios", () => {
    it("should create flashcards successfully", async () => {
      const mockGeneration = {
        id: 1,
        user_id: "user-123",
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      const mockCreatedFlashcards = [
        { id: 1, front: "Q1", back: "A1" },
        { id: 2, front: "Q2", back: "A2" },
      ];

      // Mock generation verification
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockGeneration,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock flashcard insertion
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockCreatedFlashcards,
            error: null,
          }),
        }),
      } as any);

      // Mock generation update
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const dto = {
        generationId: 1,
        flashcards: [
          { front: "Q1", back: "A1", source: "ai-full" as const },
          { front: "Q2", back: "A2", source: "ai-edited" as const },
        ],
      };

      const result = await bulkCreateFlashcards(mockSupabase, dto, "user-123");

      expect(result).toEqual(mockCreatedFlashcards);
      expect(result.length).toBe(2);
    });

    it("should update generation counters correctly", async () => {
      const mockGeneration = {
        id: 1,
        user_id: "user-123",
        accepted_unedited_count: 5,
        accepted_edited_count: 3,
      };

      // Setup mocks...
      // (similar to above)

      const dto = {
        generationId: 1,
        flashcards: [
          { front: "Q1", back: "A1", source: "ai-full" as const },
          { front: "Q2", back: "A2", source: "ai-full" as const },
          { front: "Q3", back: "A3", source: "ai-edited" as const },
        ],
      };

      await bulkCreateFlashcards(mockSupabase, dto, "user-123");

      // Verify update was called with correct counts
      // accepted_unedited_count should be 5 + 2 = 7
      // accepted_edited_count should be 3 + 1 = 4
      // (add assertions here based on mock implementation)
    });
  });

  describe("Error scenarios", () => {
    it("should throw error if generation not found", async () => {
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Not found" },
              }),
            }),
          }),
        }),
      } as any);

      const dto = {
        generationId: 999,
        flashcards: [{ front: "Q", back: "A", source: "ai-full" as const }],
      };

      await expect(bulkCreateFlashcards(mockSupabase, dto, "user-123")).rejects.toThrow("Generation not found");
    });

    it("should throw error if generation belongs to different user", async () => {
      const mockGeneration = {
        id: 1,
        user_id: "different-user",
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null, // RLS would return null
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const dto = {
        generationId: 1,
        flashcards: [{ front: "Q", back: "A", source: "ai-full" as const }],
      };

      await expect(bulkCreateFlashcards(mockSupabase, dto, "user-123")).rejects.toThrow();
    });

    it("should throw error if insert fails", async () => {
      // Mock successful generation check
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 1, user_id: "user-123", accepted_unedited_count: 0, accepted_edited_count: 0 },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock failed insert
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      } as any);

      const dto = {
        generationId: 1,
        flashcards: [{ front: "Q", back: "A", source: "ai-full" as const }],
      };

      await expect(bulkCreateFlashcards(mockSupabase, dto, "user-123")).rejects.toThrow("Failed to insert flashcards");
    });
  });
});
```

## Integration Tests

### API Endpoint Integration Tests

```typescript
// tests/integration/api/flashcards.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

// Test configuration
const SUPABASE_URL = process.env.TEST_SUPABASE_URL!;
const SUPABASE_KEY = process.env.TEST_SUPABASE_KEY!;
const API_BASE_URL = "http://localhost:4321";

describe("POST /api/flashcards Integration Tests", () => {
  let testUserId: string;
  let testToken: string;
  let testGenerationId: number;
  let supabase: ReturnType<typeof createClient<Database>>;

  beforeAll(async () => {
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

    // Create test user and login
    const { data: authData } = await supabase.auth.signUp({
      email: "test@example.com",
      password: "TestPassword123!",
    });
    testUserId = authData.user!.id;
    testToken = authData.session!.access_token;

    // Create test generation
    const { data: generation } = await supabase
      .from("generations")
      .insert({
        user_id: testUserId,
        model: "gpt-4",
        source_text_hash: "test-hash",
        source_text_length: 1000,
        generated_count: 5,
        generation_duration: 1000,
      })
      .select()
      .single();
    testGenerationId = generation!.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from("flashcards").delete().eq("user_id", testUserId);
    await supabase.from("generations").delete().eq("user_id", testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  beforeEach(async () => {
    // Clean flashcards before each test
    await supabase.from("flashcards").delete().eq("generation_id", testGenerationId);
  });

  describe("Success cases", () => {
    it("should create flashcards successfully", async () => {
      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards: [
            { front: "Question 1", back: "Answer 1", source: "ai-full" },
            { front: "Question 2", back: "Answer 2", source: "ai-edited" },
          ],
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.created).toHaveLength(2);
      expect(data.created[0]).toHaveProperty("id");
      expect(data.created[0].front).toBe("Question 1");
      expect(data.created[1].back).toBe("Answer 2");

      // Verify in database
      const { data: dbFlashcards } = await supabase
        .from("flashcards")
        .select("*")
        .eq("generation_id", testGenerationId);
      expect(dbFlashcards).toHaveLength(2);
    });

    it("should update generation counters", async () => {
      await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards: [
            { front: "Q1", back: "A1", source: "ai-full" },
            { front: "Q2", back: "A2", source: "ai-full" },
            { front: "Q3", back: "A3", source: "ai-edited" },
          ],
        }),
      });

      // Check generation counters
      const { data: generation } = await supabase
        .from("generations")
        .select("accepted_unedited_count, accepted_edited_count")
        .eq("id", testGenerationId)
        .single();

      expect(generation!.accepted_unedited_count).toBe(2);
      expect(generation!.accepted_edited_count).toBe(1);
    });
  });

  describe("Authentication errors", () => {
    it("should return 401 without token", async () => {
      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards: [{ front: "Q", back: "A", source: "ai-full" }],
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards: [{ front: "Q", back: "A", source: "ai-full" }],
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Validation errors", () => {
    it("should return 400 for empty flashcards array", async () => {
      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards: [],
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Bad Request");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for front too long", async () => {
      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards: [{ front: "A".repeat(201), back: "Answer", source: "ai-full" }],
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details[0].message).toContain("200");
    });

    it("should return 400 for invalid source", async () => {
      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards: [{ front: "Q", back: "A", source: "invalid-source" }],
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Not found errors", () => {
    it("should return 404 for non-existent generation", async () => {
      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: 999999,
          flashcards: [{ front: "Q", back: "A", source: "ai-full" }],
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Not Found");
    });
  });

  describe("Edge cases", () => {
    it("should handle max flashcards (100)", async () => {
      const flashcards = Array(100)
        .fill(null)
        .map((_, i) => ({
          front: `Question ${i}`,
          back: `Answer ${i}`,
          source: "ai-full" as const,
        }));

      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.created).toHaveLength(100);
    });

    it("should reject 101 flashcards", async () => {
      const flashcards = Array(101)
        .fill(null)
        .map((_, i) => ({
          front: `Q${i}`,
          back: `A${i}`,
          source: "ai-full" as const,
        }));

      const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: testGenerationId,
          flashcards,
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
```

## Manual Testing Checklist

### Setup

- [ ] Server is running on `http://localhost:4321`
- [ ] Test user is created
- [ ] Test generation exists
- [ ] Valid JWT token obtained

### Test Cases

#### Success Cases

- [ ] Create single flashcard
- [ ] Create multiple flashcards (2-10)
- [ ] Create max flashcards (100)
- [ ] Create with all source types (ai-full, ai-edited, manual)
- [ ] Create with max length strings (front=200, back=500)
- [ ] Verify database records created
- [ ] Verify generation counters updated

#### Validation Errors

- [ ] Empty flashcards array → 400
- [ ] 101+ flashcards → 400
- [ ] Front empty string → 400
- [ ] Front 201 characters → 400
- [ ] Back empty string → 400
- [ ] Back 501 characters → 400
- [ ] Invalid source value → 400
- [ ] Missing required fields → 400
- [ ] Invalid JSON → 400

#### Authentication Errors

- [ ] No Authorization header → 401
- [ ] Invalid Bearer token → 401
- [ ] Expired token → 401

#### Authorization Errors

- [ ] Generation belongs to different user → 404
- [ ] Non-existent generation → 404

---

**Note**: To run these tests, you would need to:

1. Install testing dependencies: `npm install -D vitest @vitest/ui`
2. Configure test database (separate from production)
3. Add test scripts to package.json
4. Set up test environment variables

**Last Updated**: 2025-10-16  
**Status**: 📝 Documentation/Template (Not yet executable)
