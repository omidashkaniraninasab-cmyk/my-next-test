import { neon } from '@neondatabase/serverless';
import { incrementCompletedGames } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { gameId, userId, finalScore } = await request.json();
    
    console.log('🎯 Marking game as completed for user:', userId);

    // 🆕 اول چک کن ببین بازی قبلاً کامل شده یا نه
    const existingGame = await sql`
      SELECT completed FROM crossword_games WHERE id = ${gameId}
    `;
    
    if (existingGame.length > 0 && existingGame[0].completed) {
      console.log('⚠️ Game already completed, skipping...');
      return Response.json({ success: true, message: 'Game was already completed' });
    }

    // ✅ آپدیت وضعیت بازی
    await sql`
      UPDATE crossword_games 
      SET 
        completed = TRUE, 
        completed_at = CURRENT_TIMESTAMP, 
        finished_at = CURRENT_TIMESTAMP,
        score = ${finalScore}
      WHERE id = ${gameId}
    `;

    // ✅ افزایش بازی‌های کامل
    await incrementCompletedGames(userId);
    console.log('✅ Completed games count incremented');

    // ✅ آپدیت وضعیت کاربر - فقط today_game_completed رو TRUE کن
    // 🆕 امتیاز اضافه نکن چون قبلاً در update-score اضافه شده
    await sql`
      UPDATE user_profiles 
      SET 
        today_game_completed = TRUE
        // 🆕 total_crossword_score رو حذف کردیم
      WHERE id = ${userId}
    `;

    console.log('✅ Game marked as completed (no additional points)');

    return Response.json({ 
      success: true,
      message: 'Game completed successfully'
    });
    
  } catch (error) {
    console.error('❌ Complete game error:', error);
    return Response.json({ 
      error: error.message
    }, { status: 500 });
  }
}