import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// ایجاد session
export async function createSession(user) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 روز
    path: '/',
  });

  return token;
}

// گرفتن session
export async function getSession() {
  const session = cookies().get('session')?.value;
  
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

// حذف session
export async function destroySession() {
  cookies().delete('session');
}