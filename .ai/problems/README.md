# Testing Scripts and Documentation

This directory contains testing scripts and documentation for the 10x-cards API.

## 📁 Files Overview

### Testing Scripts
- **`test-quick.ps1`** - Interactive PowerShell script for testing `/api/flashcards` endpoint
  - 11 pre-configured test scenarios
  - Custom request option
  - Color-coded output

- **`diagnose-db.ps1`** - Database diagnostics tool
  - Checks authentication
  - Helps identify configuration issues

- **`fix-rls.ps1`** - Migration helper to disable RLS
  - Interactive SQL execution
  - Copies SQL to clipboard for manual execution

### Documentation
- **`ROZWIAZANIE.md`** *(Polish)* - Complete explanation of the RLS issue and solution
- **`SETUP-TEST-DATA.md`** - Step-by-step guide to prepare test data
- **`apply-migration.md`** - Instructions for running RLS migration
- **`ENV-SETUP.md`** - Environment variables configuration guide

## 🚀 Quick Start

### 1. Setup Environment

Create `.env` file in project root:
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Optional
```

See `ENV-SETUP.md` for detailed instructions.

### 2. Fix RLS (if needed)

If you're getting 404 errors with "Generation not found":

```powershell
.\fix-rls.ps1
```

Or run manually in Supabase SQL Editor:
```sql
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;
```

### 3. Create Test Data

See `SETUP-TEST-DATA.md` for full instructions.

Quick version:
```sql
-- Get your user_id
SELECT id FROM auth.users WHERE email = 'test@example.com';

-- Create a generation
INSERT INTO generations (
  user_id, model, source_text_hash, 
  source_text_length, generated_count, generation_duration,
  accepted_unedited_count, accepted_edited_count
) VALUES (
  'YOUR_USER_ID',
  'gpt-4',
  'test-hash-' || gen_random_uuid()::text,
  1500, 10, 2500, 0, 0
) RETURNING id;
```

### 4. Get Access Token

Login to get token:
```bash
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123456!"}'
```

Save the `access_token` from response.

### 5. Run Tests

```powershell
.\test-quick.ps1
```

Enter your token and generation ID when prompted, then select test scenarios.

## 🧪 Test Scenarios

The `test-quick.ps1` script includes:

### Success Cases
1. Create 3 flashcards (different sources)
2. Create 1 flashcard
9. Max length strings (200/500 chars)
10. 100 flashcards (max allowed)

### Error Cases
3. Empty front field (400)
4. Front too long >200 chars (400)
5. Empty flashcards array (400)
6. No auth token (401)
7. Invalid token (401)
8. Non-existent generation (404)

### Custom
11. Custom JSON request

## 🐛 Troubleshooting

### "Generation not found or does not belong to user" (404)

**Cause:** RLS is enabled without policies, blocking all queries.

**Solution:** Run `fix-rls.ps1` or see `ROZWIAZANIE.md`

### "Invalid or expired token" (401)

**Cause:** Token expired or invalid.

**Solution:** Login again to get fresh token (tokens expire after 1 hour by default)

### "Validation failed" (400)

**Cause:** Request body doesn't match schema.

**Solution:** Check error details in response, fix request body

### Connection errors

**Causes:**
- Dev server not running
- Wrong URL in script (should be `http://localhost:3000`)

**Solution:** 
```bash
npm run dev
```

## 📚 API Endpoint Reference

### POST /api/flashcards

Creates flashcards in bulk.

**Request:**
```json
{
  "generationId": 1,
  "flashcards": [
    {
      "front": "Question text (1-200 chars)",
      "back": "Answer text (1-500 chars)",
      "source": "ai-full" | "ai-edited" | "manual"
    }
  ]
}
```

**Constraints:**
- `flashcards`: 1-100 items
- `front`: 1-200 characters
- `back`: 1-500 characters
- `source`: must be one of: `ai-full`, `ai-edited`, `manual`

**Response (201):**
```json
{
  "created": [
    {
      "id": 1,
      "front": "Question",
      "back": "Answer"
    }
  ]
}
```

**Errors:**
- `400` - Validation error
- `401` - Authentication error
- `404` - Generation not found
- `500` - Server error

## 🔐 Security Notes

- Authorization is handled at application level (not Supabase RLS)
- Always verify user owns the generation before inserting flashcards
- Service Role Key should NEVER be exposed to client-side code
- Access tokens expire after 1 hour (default)

## 📖 Additional Resources

- Main project README: `../../README.md`
- Supabase docs: https://supabase.com/docs
- Astro docs: https://docs.astro.build

