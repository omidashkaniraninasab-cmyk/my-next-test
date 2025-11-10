import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    // دریافت sessionId از cookie
    const cookieHeader = request.headers.get('cookie');
    console.log('🍪 All cookies:', cookieHeader); // برای دیباگ
    
    const sessionId = cookieHeader?.match(/session=([^;]+)/)?.[1];
    
    console.log('🔑 Extracted sessionId:', sessionId); // برای دیباگ
    
    if (!sessionId) {
      console.log('❌ No sessionId found in cookies');
      return Response.json({ user: null });
    }

    const session = await getSession(sessionId);
    
    console.log('📦 Session data from DB:', session); // برای دیباگ
    
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