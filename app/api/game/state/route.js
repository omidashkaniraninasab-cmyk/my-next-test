import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('Loading game state for user:', userId);

    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // گرفتن آخرین بازی فعال کاربر
    const games = await sql`
      SELECT * FROM crossword_games 
      WHERE user_id = ${userId} AND completed = FALSE 
      ORDER BY started_at DESC 
      LIMIT 1
    `;

    console.log('Found games:', games.length);

    if (games.length === 0) {
      return Response.json({ 
        activeGame: false,
        message: 'No active game found'
      });
    }

    const game = games[0];
    console.log('Game state loaded:', { 
      id: game.id, 
      score: game.score,
      completed: game.completed 
    });
    
    return Response.json({
      id: game.id,
      userProgress: game.user_progress,
      score: game.score,
      mistakes: game.mistakes,
      completed: game.completed,
      startedAt: game.started_at
    });
    
  } catch (error) {
    console.error('Game state error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}