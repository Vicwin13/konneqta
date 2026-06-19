import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that REQUIRE authentication.
 * If a logged-out user visits these, they're redirected to "/".
 */
const PROTECTED_ROUTES = ["/onboarding", "/post-login"];

/**
 * Routes that should ONLY be visible to logged-OUT users.
 * If a logged-in user visits these, they're redirected to "/post-login".
 */
const AUTH_ROUTES = ["/auth/login", "/auth/signup", "/auth/forgot-password"];

// NOTE: /auth/reset-password is intentionally NOT an auth route.
// The recovery email link exchanges its code for a session in
// /auth/reset-callback (which then redirects here), so the user arrives
// already logged in. Adding it to AUTH_ROUTES would break the flow by
// redirecting them to /post-login. The page guards itself: if there's
// no session (invalid/expired link), it sends the user back to
// /auth/forgot-password with an error toast.

/**
 * Checks if a path matches a route pattern.
 * Handles dynamic segments like "/:username/edit" via prefix matching.
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match (e.g. "/onboarding")
    if (pathname === route) return true;
    // For "/:username/edit" we check the /edit suffix
    if (route === "/edit" && pathname.endsWith("/edit")) return true;
    return false;
  });
}

/**
 * Proxy (formerly "middleware" in Next.js ≤15) refreshes the Supabase
 * auth session on every matched request, forwards the updated cookies,
 * and enforces route-level authentication/authorization.
 *
 * This runs before Server Components render, so:
 * 1. Auth redirects happen instantly (no flash of unauthenticated content)
 * 2. Cookies are set correctly (fixes "Cookies can only be modified
 *    in a Server Action or Route Handler" error)
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session and get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ---- Route protection logic ----

  // 1. Logged-out user trying to access a protected route → redirect to home
  const isProtectedRoute =
    matchesRoute(pathname, PROTECTED_ROUTES) || pathname.endsWith("/edit");
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Logged-in user trying to access login/signup → redirect to post-login
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/post-login", request.url));
  }

  return response;
}

export const config = {
  // Run on all routes except static assets / api / auth callbacks.
  // Both callbacks exchange a code for a session and must run without
  // middleware interference (otherwise the session refresh can race with
  // the code exchange).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth/callback|auth/reset-callback).*)",
  ],
};