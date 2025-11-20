import { neon } from '@neondatabase/serverless';
import { updateUserRanks } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId, additionalScore, currentInstantScore, resetTodayScore } = await request.json();
    
    console.log('🎯 UPDATE SCORE - User:', userId, 'Additional:', additionalScore, 'Instant:', currentInstantScore, 'Reset:', resetTodayScore);
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    if (resetTodayScore) {
      // 🆕 حالت ریست به صفر
      await sql`
        UPDATE user_profiles 
        SET 
          today_crossword_score = 0,
          instant_crossword_score = ${currentInstantScore}
        WHERE id = ${userId}
      `;
      console.log('✅ Today score reset to 0');
    } else {
      // 🆕 حالت عادی (اضافه کردن امتیاز)
      await sql`
        UPDATE user_profiles 
        SET 
          today_crossword_score = COALESCE(today_crossword_score, 0) + ${additionalScore},
          total_crossword_score = COALESCE(total_crossword_score, 0) + ${additionalScore},
          instant_crossword_score = ${currentInstantScore}
        WHERE id = ${userId}
      `;
      console.log('✅ Scores updated (added)');
    }

    // آپدیت رتبه همه کاربران
    await updateUserRanks();

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error updating score:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}