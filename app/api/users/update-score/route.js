import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId, additionalScore } = await request.json();
    
    await sql`
      UPDATE user_profiles 
      SET 
        total_crossword_score = total_crossword_score + ${additionalScore},
        crossword_games_played = crossword_games_played + 1
      WHERE id = ${userId}
    `;

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}