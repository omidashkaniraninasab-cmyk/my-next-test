import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];
    
    if (!sessionId) {
      return Response.json({ user: null });
    }

    const session = await getSession(sessionId);
    
    if (session && session.user) {
      return Response.json({ 
        user: session.user 
      });
    } else {
      return Response.json({ 
        user: null 
      });
    }
    
  } catch (error) {
    console.error('Session error:', error);
    return Response.json({ 
      user: null,
      error: error.message 
    });
  }
}