import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();
  const id = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!id) return NextResponse.redirect(new URL('/admin/login', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };
