import { cookies } from 'next/headers';

// سیستم session ساده
export async function createSession(user) {
  try {
    const sessionData = {
      user: user,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 روز
    };

    cookies().set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return sessionData;
  } catch (error) {
    console.error('Create session error:', error);
    throw error;
  }
}

export async function getSession() {
  try {
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) return null;

    const sessionData = JSON.parse(sessionCookie);
    
    // بررسی انقضا
    if (Date.now() > sessionData.expiresAt) {
      await destroySession();
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

export async function destroySession() {
  try {
    cookies().delete('session');
  } catch (error) {
    console.error('Destroy session error:', error);
  }
}