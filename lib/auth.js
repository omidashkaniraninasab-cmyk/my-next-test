import { cookies } from 'next/headers';

// یک سیستم session ساده بدون JWT
export async function createSession(user) {
  const sessionData = {
    user: user,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 روز
  };

  cookies().set('session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 روز
    path: '/',
  });

  return sessionData;
}

// گرفتن session
export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  
  if (!sessionCookie) return null;

  try {
    const sessionData = JSON.parse(sessionCookie);
    
    // بررسی انقضا
    if (Date.now() > sessionData.expiresAt) {
      destroySession();
      return null;
    }
    
    return sessionData;
  } catch (error) {
    return null;
  }
}

// حذف session
export async function destroySession() {
  cookies().delete('session');
}