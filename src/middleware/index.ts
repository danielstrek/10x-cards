import { defineMiddleware } from "astro:middleware";

import { supabaseServiceClient, createSupabaseServerInstance } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Use service client to bypass RLS - we handle auth in API routes
  context.locals.supabase = supabaseServiceClient;

  // Check user session from cookies (for SSR)
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Add user to context.locals for use in Astro pages
    context.locals.user = {
      id: user.id,
      email: user.email!,
    };
  }

  return next();
});
