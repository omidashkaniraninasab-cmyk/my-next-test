import { getSession, debugSessions } from '@/lib/auth';

export async function GET(request) {
  try {
    // دریافت sessionId از cookie - تصحیح شده
    const cookieHeader = request.headers.get('cookie');
    console.log('🍪 All cookies:', cookieHeader);
    
    // روش درست برای استخراج session از کوکی
    const sessionId = cookieHeader
      ?.split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('session='))
      ?.split('=')[1];

    console.log('🔑 Correctly extracted sessionId:', sessionId);

    // دیباگ: همه sessionهای اخیر رو ببین
    const recentSessions = await debugSessions();

    if (!sessionId) {
      console.log('❌ No sessionId found in cookies');
      return Response.json({ user: null });
    }

    const session = await getSession(sessionId);
    
    console.log('📦 Session data from DB:', session);
    
    if (session && session.user) {
      console.log('✅ User session found:', session.user.username);
      return Response.json({ 
        user: session.user 
      });
    } else {
      console.log('❌ No valid session found in database');
      return Response.json({ 
        user: null 
      });
    }
    
  } catch (error) {
    console.error('💥 Session error:', error);
    return Response.json({ 
      user: null,
      error: error.message 
    });
  }
}