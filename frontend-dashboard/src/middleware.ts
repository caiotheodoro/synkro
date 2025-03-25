import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(
    process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "synkro_token"
  );

  if (!token) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|_static|_vercel|favicon.ico|robots.txt).*)",
    "/((?!api|_next|_static|_vercel|favicon.ico|robots.txt).*)",
  ],
};
