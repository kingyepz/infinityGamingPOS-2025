
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  const isAuthenticated = !!session

  const authPages = ['/login', '/forgot-password', '/reset-password'] 

  if (!isAuthenticated && !authPages.includes(pathname) && !pathname.startsWith('/api/auth')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname) 
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && authPages.includes(pathname)) {
    const dashboardUrl = new URL('/dashboard', request.url) // Redirect to main dashboard
    return NextResponse.redirect(dashboardUrl)
  }
  
  // If user is authenticated and tries to access the bare root path `/`, redirect to `/dashboard`
  if (isAuthenticated && pathname === '/') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }


  return response
}

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
