import { destroySession } from '@/lib/auth';

export async function POST(request) {
  try {
    await destroySession();
    
    return Response.json({ 
      success: true,
      message: 'با موفقیت خارج شدید'
    });
    
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}