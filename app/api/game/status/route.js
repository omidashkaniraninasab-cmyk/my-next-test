import { neon } from '@neondatabase/serverless';
import { getTodayIranDate } from '@/lib/iran-date';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('🔍 STATUS API - User ID:', userId);
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    const todayIran = getTodayIranDate();
    
    // بررسی دقیق: کاربر امروز بازی کرده؟
    const todayGames = await sql`
      SELECT id, completed, score, created_at
      FROM crossword_games 
      WHERE user_id = ${userId} 
      AND completed = true
      AND DATE(created_at) = CURRENT_DATE
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const hasCompletedToday = todayGames.length > 0;
    const todayScore = todayGames[0]?.score || 0;

    console.log('🔍 STATUS API - Accurate Result:', {
      userId,
      todayIran,
      hasCompletedToday,
      todayScore,
      gameId: todayGames[0]?.id,
      gameDate: todayGames[0]?.created_at,
      finalStatus: hasCompletedToday ? 'COMPLETED' : 'ACTIVE'
    });

    return Response.json({
      today_game_completed: hasCompletedToday,
      today_score: todayScore
    });
    
  } catch (error) {
    console.error('❌ STATUS API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}