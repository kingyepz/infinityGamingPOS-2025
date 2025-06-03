
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Placeholder: In a real app, you'd check for a valid session cookie from Supabase
  const isAuthenticated = request.cookies.has('supabase-auth-token'); // Example cookie name
  const { pathname } = request.nextUrl;

  // If trying to access any page other than login or auth-related pages, and not authenticated, redirect to login
  if (!isAuthenticated && !pathname.startsWith('/login') && !pathname.startsWith('/forgot-password') && !pathname.startsWith('/api/auth')) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (isAuthenticated && pathname.startsWith('/login')) {
    const dashboardUrl = new URL('/', request.url) // Assuming '/' is your main dashboard
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     * - assets (public assets folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)',
  ],
}
