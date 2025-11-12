// app/api/game/complete/route.js
import { neon } from '@neondatabase/serverless';
import { updateUserRanks } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { gameId, finalScore, userId } = await request.json();
    
    console.log('🎯 Completing game:', { gameId, finalScore, userId });
    
    if (!gameId || !userId) {
      return Response.json({ error: 'Game ID and User ID required' }, { status: 400 });
    }

    // ۱. آپدیت وضعیت بازی
    await sql`
      UPDATE crossword_games 
      SET 
        completed = TRUE, 
        score = ${finalScore}, 
        completed_at = CURRENT_TIMESTAMP, 
        finished_at = CURRENT_TIMESTAMP
      WHERE id = ${gameId}
    `;

    // ۲. آپدیت وضعیت کاربر - بازی امروز تموم شد
    await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = ${finalScore},
        total_crossword_score = COALESCE(total_crossword_score, 0) + ${finalScore},
        today_game_completed = TRUE,
        crossword_games_played = COALESCE(crossword_games_played, 0) + 1,
        completed_crossword_games = COALESCE(completed_crossword_games, 0) + 1
      WHERE id = ${userId}
    `;

    // ۳. آپدیت رتبه همه کاربران
    await updateUserRanks();

    console.log('✅ Game completed and user status updated');

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error completing game:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}