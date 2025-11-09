import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSession();
    
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
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}