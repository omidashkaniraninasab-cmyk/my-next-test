import { updateLoginTime } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    await updateLoginTime(userId);

    return Response.json({ 
      success: true,
      message: 'زمان ورود آپدیت شد'
    });
    
  } catch (error) {
    console.error('Update login time error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}