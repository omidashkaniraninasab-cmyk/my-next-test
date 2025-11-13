import { NextResponse } from 'next/server';

export function middleware(request) {
  // این middleware فقط برای logging است
  // بقیه کار در route.js انجام می‌شود
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};