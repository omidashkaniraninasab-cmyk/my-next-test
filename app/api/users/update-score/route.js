import { neon } from '@neondatabase/serverless';
import { updateUserRanks } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

// برای ردیابی درخواست‌های اخیر (پیشگیری از duplicate)
const recentBonusRequests = new Map();

export async function POST(request) {
  try {
    const { userId, additionalScore, currentInstantScore, resetTodayScore, isCompletion } = await request.json();
    
    console.log('🎯 UPDATE SCORE - User:', userId, 'Additional:', additionalScore, 'Instant:', currentInstantScore, 'Reset:', resetTodayScore, 'IsCompletion:', isCompletion);
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // 🆕 مکانیزم جلوگیری از پاداش تکراری
    if (isCompletion && additionalScore === 50) {
       console.log('💰 COMPLETION BONUS - Processing...');
      const requestKey = `${userId}_completion_bonus`;
      const now = Date.now();
      const lastRequest = recentBonusRequests.get(requestKey);
      
      // اگر در 10 ثانیه گذشته همین درخواست دریافت شده، نادیده بگیر
      if (lastRequest && (now - lastRequest) < 10000) {
        console.log('🛑 DUPLICATE BONUS REQUEST - Skipping');
        return Response.json({ 
          success: true, 
          message: 'Duplicate bonus request ignored' 
        });
      }
      
      // ذخیره زمان این درخواست
      recentBonusRequests.set(requestKey, now);
      console.log('✅ Bonus request registered:', requestKey);
    }

    if (resetTodayScore) {
      // حالت ریست به صفر
      await sql`
        UPDATE user_profiles 
        SET 
          today_crossword_score = 0,
          instant_crossword_score = ${currentInstantScore}
        WHERE id = ${userId}
      `;
      console.log('✅ Today score reset to 0');
    } else {
      // حالت عادی (اضافه کردن امتیاز)
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