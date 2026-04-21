import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Note: Standard Supabase naming uses ANON_KEY, not PUBLISHABLE_KEY. 
    // Make sure this matches your .env.local file.
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, 
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // SECURITY: Always use getUser() in middleware to protect routes. 
  // It guarantees the session is valid by checking the Supabase auth server.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  
  // Define routes that do not require authentication
  const isPublicRoute = pathname === "/" || pathname.startsWith("/auth");

  // 1. Block unauthenticated users from accessing protected pages
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 2. Prevent authenticated users from accessing login/signup pages
  if (user && pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    // Redirect them to their dashboard or protected route
    url.pathname = "/onboarding"; 
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}