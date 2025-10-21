# Environment Variables Setup

## Required Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your_anon_key_here

# Optional: Service Role Key for server-side operations (bypasses RLS)
# IMPORTANT: Never commit this key or expose it to client-side code!
# Only use in server-side code (API routes, middleware)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter API Key (for AI generation)
OPENROUTER_API_KEY=your_openrouter_key_here
```

## Getting Supabase Keys

### Local Development (Supabase CLI)

If you're using Supabase locally:

```bash
npx supabase start
```

This will output:
- `API URL` → use as `SUPABASE_URL`
- `anon key` → use as `SUPABASE_KEY`
- `service_role key` → use as `SUPABASE_SERVICE_ROLE_KEY`

### Cloud/Hosted Supabase

1. Go to your project in [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Settings** → **API**
3. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon/public key` → `SUPABASE_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" button)

## Important Security Notes

### ✅ Safe to use client-side:
- `SUPABASE_URL`
- `SUPABASE_KEY` (anon key)

### ❌ NEVER expose to client:
- `SUPABASE_SERVICE_ROLE_KEY` - This bypasses ALL RLS policies and gives full access to your database!

In this project:
- Service Role Key is ONLY used in `middleware/index.ts` (server-side)
- It's optional - if not provided, falls back to anon key
- We manually check user authorization in API routes

## Why Service Role Key?

After disabling RLS policies (migration `20251013184800`), we have two options:

### Option 1: Disable RLS completely (simpler)
```sql
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
```
→ Use anon key, handle auth in application code

### Option 2: Keep RLS enabled, use Service Role Key
→ Service Role Key bypasses RLS, so same effect
→ But more secure if you accidentally leave RLS enabled

## Current Setup

The code supports both approaches:
- If `SUPABASE_SERVICE_ROLE_KEY` is set → uses it (bypasses RLS)
- If not set → uses anon key (requires RLS disabled)

Either way, **authorization is checked in API routes**:
```typescript
// src/lib/services/flashcards.service.ts
.eq('user_id', userId)  // ✅ Always verify ownership!
```

## Testing

For testing, you can use a test token. See `SETUP-TEST-DATA.md` for details.

