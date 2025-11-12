import { neon } from '@neondatabase/serverless';
import { updateUserRanks } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId, additionalScore } = await request.json();
    
    console.log('Updating score for user:', userId, 'Additional score:', additionalScore);
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // بررسی و ریست امتیاز امروز اگر تاریخ تغییر کرده
    await resetTodayScoreIfNeeded(userId);

    // آپدیت امتیاز کاربر - فقط today_crossword_score برای امتیاز امروز
    await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = COALESCE(today_crossword_score, 0) + ${additionalScore},
        total_crossword_score = COALESCE(total_crossword_score, 0) + ${additionalScore},
        instant_crossword_score = ${additionalScore}
      WHERE id = ${userId}
    `;

    // آپدیت رتبه همه کاربران
    await updateUserRanks();

    console.log('✅ Score and ranks updated successfully');

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Error updating score:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// تابع جدید برای ریست امتیاز امروز اگر تاریخ تغییر کرده
async function resetTodayScoreIfNeeded(userId) {
  try {
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; // تاریخ امروز
    
    // بررسی آیا کاربر نیاز به ریست امتیاز امروز دارد
    const user = await sql`
      SELECT today_login_time, today_crossword_score, last_score_reset_date
      FROM user_profiles 
      WHERE id = ${userId}
    `;

    if (user.length === 0) return;

    const userData = user[0];
    const lastResetDate = userData.last_score_reset_date ? 
      new Date(userData.last_score_reset_date).toISOString().split('T')[0] : null;

    // اگر تاریخ ریست با امروز متفاوت است
    if (!lastResetDate || lastResetDate !== todayDate) {
      
      console.log('🔄 Resetting today score for user:', userId, 'Previous reset date:', lastResetDate);
      
      // ریست امتیاز امروز و آپدیت تاریخ ریست
      await sql`
        UPDATE user_profiles 
        SET 
          today_crossword_score = 0,
          last_score_reset_date = ${todayDate}
        WHERE id = ${userId}
      `;
    }
  } catch (error) {
    console.error('Error resetting today score:', error);
  }
}