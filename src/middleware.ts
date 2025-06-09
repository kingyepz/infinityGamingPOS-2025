
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
  // Added /signup and /auth/update-password to authPages
  const authPages = ['/login', '/forgot-password', '/auth/update-password', '/signup']; 

  // If not authenticated and not an auth page or API auth route, redirect to login
  if (!isAuthenticated && !authPages.includes(pathname) && !pathname.startsWith('/api/auth')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname); // Preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated:
  if (isAuthenticated) {
    // If on an auth page, redirect to a default dashboard path.
    if (authPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If user is authenticated and tries to access the bare root path `/`, redirect to `/dashboard`
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Role-based protection for specific dashboard paths
    if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/cashier')) {
      // Ideally, role would come from JWT custom claims for performance.
      // For now, querying 'users' table.
      const { data: userData, error: userDbError } = await supabase
        .from('users') // Changed from 'staff' to 'users'
        .select('role')
        .eq('id', user.id) // Changed from 'user_id' to 'id'
        .single();

      if (userDbError || !userData) { 
          console.error("Middleware: Error fetching user role or user record not found in 'users' table:", userDbError?.message);
          if (pathname !== '/dashboard') {
            return NextResponse.redirect(new URL('/dashboard?error=role_check_failed', request.url));
          }
      } else {
        const userRole = userData.role;
        if (pathname.startsWith('/dashboard/admin') && userRole !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized_admin_access', request.url));
        }
        // Supervisor and Cashier might share a dashboard or have distinct ones.
        // Adjust logic here based on specific requirements for 'cashier' and 'supervisor' roles.
        if (pathname.startsWith('/dashboard/cashier') && userRole !== 'cashier' && userRole !== 'admin' && userRole !== 'supervisor') {
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized_cashier_access', request.url));
        }
      }
    }
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
     * - auth/update-password (allow access to this path for password reset)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|auth/update-password).*)',
    // Ensure auth/update-password is also matched by middleware if it needs to check auth status for redirection
    // However, the above negative lookahead should allow it if it's an auth page.
    // Re-adding it explicitly if it needs protection/redirection when authenticated.
    // For now, it's an authPage, so handled by `authPages` check.
  ],
};
