import { createClient, type SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for public/anon operations (with RLS)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service client for server-side operations (bypasses RLS)
// Use this in API routes where you handle authorization manually
export const supabaseServiceClient = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseClient; // Fallback to regular client if service key not available

// Export the typed SupabaseClient for use in services
export type SupabaseClient = BaseSupabaseClient<Database>;


