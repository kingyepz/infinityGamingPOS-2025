
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
  // Added /signup to authPages
  const authPages = ['/login', '/forgot-password', '/reset-password', '/signup']; 

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
    // This logic relies on the user being fully set up, including their role in the 'staff' table.
    if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/cashier')) {
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (staffError || !staffMember) { 
          console.error("Middleware: Error fetching staff role or staff member not found:", staffError?.message);
          // If role cannot be determined, redirect to general dashboard or an error page.
          // This prevents access to role-specific pages if the role is unknown.
          if (pathname !== '/dashboard') { // Avoid redirect loop if already on general dashboard
            return NextResponse.redirect(new URL('/dashboard?error=role_check_failed', request.url));
          }
      } else {
        const userRole = staffMember.role;
        if (pathname.startsWith('/dashboard/admin') && userRole !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized_admin_access', request.url));
        }
        if (pathname.startsWith('/dashboard/cashier') && userRole !== 'cashier' && userRole !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized_cashier_access', request.url));
        }
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
