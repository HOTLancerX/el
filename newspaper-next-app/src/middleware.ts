import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect routes under /admin
  if (pathname.startsWith('/admin')) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not set. JWT decryption will fail.');
      // Potentially redirect to an error page or allow access in dev if misconfigured,
      // but for security, better to deny if secret is missing.
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const token = await getToken({ req, secret });

    if (!token) {
      // User is not authenticated, redirect to sign-in page
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname); // Pass the original path as callbackUrl
      return NextResponse.redirect(signInUrl);
    }

    // Optional: Role-based access control
    // If you want to ensure only users with a specific role (e.g., 'admin', 'editor')
    // can access the /admin section.
    // The role should be part of your token (see NextAuth callbacks in [...nextauth]/route.ts)
    // if (token.role !== 'admin' && token.role !== 'editor') {
    //   // Redirect to an access denied page or homepage
    //   const accessDeniedUrl = new URL('/access-denied', req.url); // You'd need to create this page
    //   return NextResponse.redirect(accessDeniedUrl);
    // }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin/:path*', // Protect all routes under /admin
    // Add other paths that need protection if any, e.g., '/api/admin/:path*'
  ],
};
