import { defineMiddleware } from 'astro:middleware';

import { supabaseServiceClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware((context, next) => {
  // Use service client to bypass RLS - we handle auth in API routes
  context.locals.supabase = supabaseServiceClient;
  return next();
});


