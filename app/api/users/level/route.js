import { getUserLevel, addUserXP } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: 'UserId required' }, { status: 400 });
    }
    
    const userLevel = await getUserLevel(userId);
    return Response.json({ success: true, level: userLevel });
    
  } catch (error) {
    console.error('Level API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, xp, reason } = await request.json();
    
    if (!userId || !xp) {
      return Response.json({ error: 'UserId and XP required' }, { status: 400 });
    }
    
    const result = await addUserXP(userId, xp, reason || 'دستی');
    return Response.json({ success: true, result });
    
  } catch (error) {
    console.error('Level API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}