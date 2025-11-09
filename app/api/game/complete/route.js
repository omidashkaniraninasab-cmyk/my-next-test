import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { gameId, finalScore } = await request.json();
    
    if (!gameId) {
      return Response.json({ error: 'Game ID required' }, { status: 400 });
    }

    await sql`
      UPDATE crossword_games 
      SET 
        completed = TRUE,
        score = ${finalScore},
        completed_at = CURRENT_TIMESTAMP,
        finished_at = CURRENT_TIMESTAMP
      WHERE id = ${gameId}
    `;

    return Response.json({ 
      success: true,
      message: 'Game completed successfully'
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}