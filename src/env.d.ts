/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string; // Optional - for server-side operations
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_SITE_URL?: string; // For password reset redirects
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
