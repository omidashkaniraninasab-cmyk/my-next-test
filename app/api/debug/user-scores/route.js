// app/api/debug/user-scores/route.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await sql`
      SELECT today_crossword_score, total_crossword_score, instant_crossword_score, today_game_completed
      FROM user_profiles 
      WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      today_score: user[0].today_crossword_score,
      total_score: user[0].total_crossword_score,
      instant_score: user[0].instant_crossword_score,
      game_completed: user[0].today_game_completed
    });
    
  } catch (error) {
    console.error('Error getting user scores:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}