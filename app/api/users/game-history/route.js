import { getUserGameHistory } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') || 10;

    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    const history = await getUserGameHistory(userId, parseInt(limit));

    return Response.json({
      success: true,
      history: history,
      count: history.length
    });
    
  } catch (error) {
    console.error('Game history error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}