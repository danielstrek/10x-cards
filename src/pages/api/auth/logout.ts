import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance for auth
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out from Supabase (invalidates the session)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signOut error:', error);
      // Continue even if there's an error - we'll clear cookies anyway
    }

    // Delete auth cookies
    // IMPORTANT: Use the same path as when setting cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    
    // Delete any other Supabase auth cookies that might exist
    // (Supabase SSR might create additional cookies)
    const allCookies = cookies.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        cookies.delete(cookie.name, { path: '/' });
      }
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    // Even on error, try to clear cookies
    console.error('Unexpected error in logout endpoint:', error);
    
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    
    return new Response(null, { status: 204 });
  }
};

