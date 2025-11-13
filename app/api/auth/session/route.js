import { getSession, debugSessions } from '@/lib/auth';

export async function GET(request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    console.log('🍪 All cookies:', cookieHeader);
    
    const sessionId = cookieHeader
      ?.split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('session='))
      ?.split('=')[1];

    console.log('🔑 Extracted sessionId:', sessionId);

    if (!sessionId) {
      console.log('❌ No sessionId found in cookies');
      return Response.json({ user: null });
    }

    const session = await getSession(sessionId);
    
    console.log('📦 Session data from DB:', session);
    
    if (session && session.sessionData && session.sessionData.user) {
      console.log('✅ User session found:', session.sessionData.user.username);
      return Response.json({ 
        success: true,
        user: session.sessionData.user 
      });
    } else {
      console.log('❌ No valid session found in database');
      return Response.json({ 
        success: false,
        user: null 
      });
    }
    
  } catch (error) {
    console.error('💥 Session error:', error);
    return Response.json({ 
      success: false,
      user: null,
      error: error.message 
    });
  }
}