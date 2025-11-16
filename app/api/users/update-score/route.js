import { neon } from '@neondatabase/serverless';
import { updateUserRanks } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId, additionalScore, currentInstantScore } = await request.json();
    
    console.log('🎯 UPDATE SCORE - User:', userId, 'Additional:', additionalScore, 'Instant:', currentInstantScore);
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // 🆕 **همیشه هر سه امتیاز را آپدیت کن**
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

    console.log('✅ All scores updated');

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error updating score:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}