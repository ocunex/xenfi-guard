
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard', '/peers', '/interfaces', '/settings']; 
const publicRoutes = ['/login', '/api/auth/login']; // routes that don't need auth

export async function proxy(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);
  
  // Also protect root '/' if it redirects to dashboard usually
  const isRoot = path === '/';

  // 3. Decrypt the session from the cookie
  const cookie = req.cookies.get('xenfi_session')?.value;
  
  if (path.startsWith('/login') || path === '/') {
       console.log(`[PROXY] Path: ${path}, Cookie: ${cookie ? 'Present' : 'Missing'}`);
  }

  const session = await decrypt(cookie);

  if (path.startsWith('/login') || path === '/') {
       console.log(`[PROXY] Session Decrypted: ${session ? 'Success' : 'Fail'}`);
  }

  // 4. Redirect to /login if the user is not authenticated
  if ((isProtectedRoute || isRoot) && !session) {
    console.log(`[PROXY] Redirecting to /login from ${path}`);
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 5. Redirect to / (or dashboard) if the user is authenticated and trying to access /login
  if (isPublicRoute && session && path === '/login') {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
