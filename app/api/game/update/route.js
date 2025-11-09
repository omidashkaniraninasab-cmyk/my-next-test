import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { gameId, userProgress, score, mistakes } = await request.json();
    
    if (!gameId) {
      return Response.json({ error: 'Game ID required' }, { status: 400 });
    }

    await sql`
      UPDATE crossword_games 
      SET 
        user_progress = ${JSON.stringify(userProgress)},
        score = ${score},
        mistakes = ${mistakes},
        finished_at = CURRENT_TIMESTAMP
      WHERE id = ${gameId}
    `;

    return Response.json({ 
      success: true,
      message: 'Game state updated'
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}