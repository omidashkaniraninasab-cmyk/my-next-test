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
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}