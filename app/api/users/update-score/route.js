import { neon } from '@neondatabase/serverless';
import { updateUserRanks } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId, additionalScore, currentInstantScore } = await request.json();
    
    console.log('Updating score for user:', userId, 'Additional score:', additionalScore, 'Current instant:', currentInstantScore);
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // 🆕 فقط اگر additionalScore صفر است (شروع بازی جدید) ریست کن
    if (additionalScore === 0) {
      await resetTodayScoreIfNeeded(userId);
    }

    // آپدیت امتیاز کاربر
    await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = COALESCE(today_crossword_score, 0) + ${additionalScore},
        total_crossword_score = COALESCE(total_crossword_score, 0) + ${additionalScore},
        instant_crossword_score = ${currentInstantScore}
      WHERE id = ${userId}
    `;

    // آپدیت رتبه همه کاربران
    await updateUserRanks();

    console.log('✅ All scores updated successfully');

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Error updating score:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 🆕 تابع ساده‌تر برای ریست
async function resetTodayScoreIfNeeded(userId) {
  try {
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    
    const user = await sql`
      SELECT last_score_reset_date
      FROM user_profiles 
      WHERE id = ${userId}
    `;

    if (user.length === 0) return;

    const userData = user[0];
    const lastResetDate = userData.last_score_reset_date ? 
      new Date(userData.last_score_reset_date).toISOString().split('T')[0] : null;

    // فقط اگر تاریخ تغییر کرده باشد ریست کن
    if (!lastResetDate || lastResetDate !== todayDate) {
      console.log('🔄 Resetting today score for new day:', userId);
      
      await sql`
        UPDATE user_profiles 
        SET 
          today_crossword_score = 0,
          instant_crossword_score = 0,
          today_game_completed = FALSE,  -- 🆕 این خط حیاتی
          last_score_reset_date = ${todayDate}
        WHERE id = ${userId}
      `;
    }
  } catch (error) {
    console.error('Error resetting today score:', error);
  }
}