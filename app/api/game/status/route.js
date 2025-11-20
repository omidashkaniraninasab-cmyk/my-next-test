// app/api/game/status/route.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('🔍 STATUS API - User ID:', userId);
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // 🆕 **ساده‌شده: فقط اطلاعات کاربر رو بررسی کن**
    const user = await sql`
      SELECT today_crossword_score, today_game_completed, last_game_date
      FROM user_profiles 
      WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const todayScore = user[0].today_crossword_score || 0;
    const todayGameCompleted = user[0].today_game_completed;
    const lastGameDate = user[0].last_game_date;

    // 🆕 **منطق ساده: فقط اگر last_game_date امروز باشه و امتیاز > 0**
    const isLastGameToday = lastGameDate && 
      new Date(lastGameDate).toDateString() === new Date().toDateString();

    const isGameCompleted = todayGameCompleted && todayScore > 0 && isLastGameToday;

    console.log('🔍 STATUS API - Simple Result:', {
      userId,
      todayScore,
      todayGameCompleted,
      lastGameDate: lastGameDate ? new Date(lastGameDate).toISOString() : 'null',
      isLastGameToday,
      finalStatus: isGameCompleted ? 'COMPLETED' : 'ACTIVE'
    });

    return Response.json({
      today_game_completed: isGameCompleted,
      today_score: todayScore
    });
    
  } catch (error) {
    console.error('❌ STATUS API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}