import { neon } from '@neondatabase/serverless';
import { incrementCompletedGames } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { gameId, userId, finalScore } = await request.json();
    
    console.log('🎯 Marking game as completed for user:', userId);

    // اول چک کن ببین بازی قبلاً کامل شده یا نه
    const existingGame = await sql`
      SELECT completed FROM crossword_games WHERE id = ${gameId}
    `;
    
    if (existingGame.length > 0 && existingGame[0].completed) {
      console.log('⚠️ Game already completed, skipping...');
      return Response.json({ success: true, message: 'Game was already completed' });
    }

    try {
      // 🆕 گرفتن user_code و display_name کاربر
      const user = await sql`
        SELECT user_code, display_name FROM user_profiles WHERE id = ${userId}
      `;
      
      const userCode = user[0]?.user_code;
      const displayName = user[0]?.display_name;

      console.log('🎯 User details for completion:', { userCode, displayName });

      // ✅ آپدیت وضعیت بازی + فیلدهای کاربر
      await sql`
        UPDATE crossword_games 
        SET 
          completed = TRUE, 
          completed_at = CURRENT_TIMESTAMP, 
          finished_at = CURRENT_TIMESTAMP,
          score = ${finalScore},
          user_code = ${userCode},
          display_name = ${displayName}
        WHERE id = ${gameId}
      `;

      console.log('✅ Game completed with user details updated');

    } catch (updateError) {
      console.error('❌ Update with user fields failed, trying fallback...', updateError);
      
      // 🆕 Fallback: آپدیت بدون فیلدهای کاربر
      await sql`
        UPDATE crossword_games 
        SET 
          completed = TRUE, 
          completed_at = CURRENT_TIMESTAMP, 
          finished_at = CURRENT_TIMESTAMP,
          score = ${finalScore}
        WHERE id = ${gameId}
      `;
      
      console.log('✅ Game completed (fallback without user details)');
    }

    // ✅ افزایش بازی‌های کامل
    await incrementCompletedGames(userId);
    console.log('✅ Completed games count incremented');

    // ✅ آپدیت وضعیت کاربر
    await sql`
      UPDATE user_profiles 
      SET today_game_completed = TRUE
      WHERE id = ${userId}
    `;

    console.log('✅ Game marked as completed');

    return Response.json({ 
      success: true,
      message: 'Game completed successfully'
    });
    
  } catch (error) {
    console.error('❌ Complete game error:', error);
    return Response.json({ 
      error: error.message,
      details: 'خطا در تکمیل بازی'
    }, { status: 500 });
  }
}