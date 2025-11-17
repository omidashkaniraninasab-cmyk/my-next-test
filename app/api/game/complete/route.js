import { neon } from '@neondatabase/serverless';
import { incrementCompletedGames } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { gameId, userId, finalScore } = await request.json();
    
    console.log('🎯 Marking game as completed for user:', userId, 'Final Score:', finalScore);

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

    // ✅ آپدیت وضعیت کاربر - فقط 50 امتیاز پاداش به کل اضافه کن
    await sql`
      UPDATE user_profiles 
      SET 
        today_game_completed = TRUE,
        total_crossword_score = COALESCE(total_crossword_score, 0) + 50  -- 🆕 فقط 50 امتیاز پاداش
      WHERE id = ${userId}
    `;

    console.log('✅ Only 50 bonus points added to total score');

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