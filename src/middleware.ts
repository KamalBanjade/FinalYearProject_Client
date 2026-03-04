import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Routes that don't require authentication
const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/confirm-email',
    '/auth/verify-email',
    '/auth/confirm-email',
    '/auth/reset-password',
    '/auth/forgot-password',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/emergency',
    '/access',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Fix legacy /auth/ links (remove the prefix)
    if (pathname.startsWith('/auth/')) {
        const newPathname = pathname.replace('/auth/', '/');
        const url = request.nextUrl.clone();
        url.pathname = newPathname;
        return NextResponse.redirect(url);
    }

    // 1. Skip static assets and public files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 2. Check if it's a public route
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // 3. Get Auth Token
    const token = request.cookies.get('auth_token')?.value;

    // 4. Handle Redirection Logic
    if (!token) {
        // If not authenticated and trying to access protected route
        if (!isPublicRoute) {
            const redirectUrl = new URL('/login', request.url);
            redirectUrl.searchParams.set('returnUrl', pathname);
            return NextResponse.redirect(redirectUrl);
        }
        return NextResponse.next();
    }

    // 5. If Authenticated
    try {
        const decoded: any = jwtDecode(token);
        const userRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];
        const isExp = decoded.exp * 1000 < Date.now();

        if (isExp) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth_token');
            return response;
        }

        // Prevent authenticated users from visiting login/register
        if (pathname === '/login' || pathname === '/register') {
            if (userRole === 'Admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            if (userRole === 'Doctor') return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Role-based Access Control
        if (pathname.startsWith('/admin') && userRole !== 'Admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        if (pathname.startsWith('/doctor') && userRole !== 'Doctor') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Patient routes are default (no prefix), but we should ensure Admins/Doctors
        // can still access generic profile/settings if we didn't prefix them.
        // Actually, the user's plan says profile is at /profile for patients,
        // but /doctor/profile for doctors.
        // If a doctor tries to access /profile, we might want to redirect them to /doctor/profile.
        if (pathname === '/profile' && userRole === 'Doctor') {
            return NextResponse.redirect(new URL('/doctor/profile', request.url));
        }
        if (pathname === '/profile' && userRole === 'Admin') {
            // Admin profile might just be a generic one or none? 
            // The prompt says /admin/profile isn't explicitly listed but typically exists.
            // For now, let it be.
        }

        return NextResponse.next();
    } catch (error) {
        // Invalid token
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
