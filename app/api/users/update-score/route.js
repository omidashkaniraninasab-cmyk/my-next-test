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

    // آپدیت امتیاز کاربر
    await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = COALESCE(today_crossword_score, 0) + ${additionalScore},
        total_crossword_score = COALESCE(total_crossword_score, 0) + ${additionalScore},
        instant_crossword_score = ${additionalScore},
        crossword_games_played = COALESCE(crossword_games_played, 0) + 1
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