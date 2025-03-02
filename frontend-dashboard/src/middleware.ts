import { NextRequest, NextResponse } from "next/server";

// This middleware will only run on the server side
// For client-side auth checks, we use the _app.tsx component
export function middleware(request: NextRequest) {
  // Check if there's a token in the request cookies
  // Note: We can't access localStorage here as it's server-side
  const token = request.cookies.get(
    process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || "synkro_token"
  );

  // If no token is found, we'll let the client-side handle the auth check
  // This prevents unnecessary redirects if the user is actually authenticated in localStorage
  if (!token) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Add the paths that should be protected by authentication
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /robots.txt (static files)
     */
    "/((?!api|_next|_static|_vercel|favicon.ico|robots.txt).*)",
  ],
};
