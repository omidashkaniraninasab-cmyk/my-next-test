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

    // 🆕 **ریست امتیاز امروز فقط اگر تاریخ تغییر کرده و additionalScore صفر نیست**
    await resetTodayScoreIfNeeded(userId, additionalScore);

    // آپدیت امتیاز کاربر - با instant_crossword_score
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

// 🆕 **تابع اصلاح شده برای ریست امتیاز امروز**
async function resetTodayScoreIfNeeded(userId, additionalScore) {
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

    // 🆕 **فقط اگر تاریخ تغییر کرده و additionalScore صفر است ریست کن**
    // این یعنی کاربر هنوز بازی امروز را شروع نکرده
    if ((!lastResetDate || lastResetDate !== todayDate) && additionalScore === 0) {
      console.log('🔄 Resetting today score for user:', userId);
      
      await sql`
        UPDATE user_profiles 
        SET 
          today_crossword_score = 0,
          instant_crossword_score = 0,
          last_score_reset_date = ${todayDate}
        WHERE id = ${userId}
      `;
    } else if (!lastResetDate || lastResetDate !== todayDate) {
      // 🆕 **اگر تاریخ تغییر کرده اما additionalScore صفر نیست، فقط تاریخ رو آپدیت کن**
      console.log('📅 Updating reset date for user:', userId);
      
      await sql`
        UPDATE user_profiles 
        SET 
          last_score_reset_date = ${todayDate}
        WHERE id = ${userId}
      `;
    }
  } catch (error) {
    console.error('Error resetting today score:', error);
  }
}