import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

// Validation schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse and validate JSON body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Invalid JSON' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate schema
    const validationResult = forgotPasswordSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email } = validationResult.data;

    // 3. Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // 4. Send password reset email
    // IMPORTANT: Always return success (security best practice)
    // Don't reveal whether the email exists in the system
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) {
      console.error('Supabase password reset error:', error);
      // Still return success to user (don't reveal error details)
    }

    // 5. Always return success message
    // This prevents email enumeration attacks
    return new Response(
      JSON.stringify({
        message: 'If the email exists, a password reset link has been sent',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in forgot-password endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'An unexpected error occurred' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

