import { destroySession } from '@/lib/auth';

export async function POST(request) {
  try {
    // خواندن sessionId از کوکی‌های درخواست
    const cookies = request.headers.get('cookie') || '';
    const sessionId = cookies
      .split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1];

    if (!sessionId) {
      return Response.json({ 
        error: 'Session یافت نشد' 
      }, { status: 401 });
    }

    // حذف session از دیتابیس
    const success = await destroySession(sessionId);

    if (!success) {
      return Response.json({ 
        error: 'خطا در حذف session' 
      }, { status: 500 });
    }

    // حذف کوکی از طرف کلاینت
    return new Response(JSON.stringify({ 
      success: true,
      message: 'با موفقیت خارج شدید'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
      }
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ 
      error: error.message || 'خطای سرور'
    }, { status: 500 });
  }
}