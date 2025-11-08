import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId, additionalScore } = await request.json();
    
    console.log('Updating score for user:', userId, 'Additional score:', additionalScore);
    
    // آپدیت همزمان امتیاز امروز و امتیاز کل
    await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = today_crossword_score + ${additionalScore},
        total_crossword_score = total_crossword_score + ${additionalScore},
        instant_crossword_score = ${additionalScore},
        crossword_games_played = crossword_games_played + 1
      WHERE id = ${userId}
    `;

    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Error updating score:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}