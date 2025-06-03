
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const { pathname } = request.nextUrl;

  const isAuthenticated = !!user;
  const authPages = ['/login', '/forgot-password', '/reset-password'];

  // If not authenticated and not an auth page or API auth route, redirect to login
  if (!isAuthenticated && !authPages.includes(pathname) && !pathname.startsWith('/api/auth')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated:
  if (isAuthenticated) {
    // If on an auth page, redirect to a default dashboard path.
    // The client-side login will handle role-specific redirection.
    if (authPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If user is authenticated and tries to access the bare root path `/`, redirect to `/dashboard`
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Role-based protection for specific dashboard paths
    const { data: staffMember, error: staffError } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (staffError && !pathname.startsWith('/dashboard')) { 
        // If there's an error fetching role, and not already trying to go to a general dashboard,
        // let them proceed to a general dashboard or error page rather than blocking completely.
        // However, this might still allow access if staff record is missing.
        // A stricter approach would redirect to login or an error page.
        console.error("Middleware: Error fetching staff role:", staffError.message);
    }
    
    const userRole = staffMember?.role;

    if (pathname.startsWith('/dashboard/admin')) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
      }
    } else if (pathname.startsWith('/dashboard/cashier')) {
      if (userRole !== 'cashier' && userRole !== 'admin') { // Admins can access cashier dashboard
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
      }
    }
    // Add more role-specific path checks here if needed
  }

  return response;
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
};
