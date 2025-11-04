import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
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
          error: "Bad Request",
          message: "Invalid JSON",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Validate schema
    const validationResult = registerSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // 3. Create Supabase server instance for auth
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // 4. Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation can be configured in Supabase Dashboard
        // For MVP, we recommend disabling email confirmation
        emailRedirectTo: `${import.meta.env.PUBLIC_SITE_URL || "http://localhost:3000"}/auth/verify-email`,
      },
    });

    if (error) {
      console.error("Supabase registration error:", error);

      // Check for specific errors
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: "Email already registered",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Registration failed",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "User creation failed",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. If email confirmation is disabled, user can login immediately
    // If enabled, they need to verify email first
    // Supabase SSR automatically sets cookies if session exists

    return new Response(
      JSON.stringify({
        userId: data.user.id,
        email: data.user.email!,
        createdAt: data.user.created_at,
        // If session exists (auto-confirm enabled), return tokens
        ...(data.session && {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
        }),
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in register endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
