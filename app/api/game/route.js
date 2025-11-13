import { neon } from '@neondatabase/serverless';
import { createNewGame, markGameStarted } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { action, userId, gameData, userProgress, gameId } = await request.json();
    
    console.log('Game API called:', { action, userId, gameId });

    if (action === 'start') {
      const game = await createNewGame(userId, gameData);
      return Response.json({ success: true, game: game });
    } else if (action === 'first-input') {
      console.log('🎯 first-input called with:', { gameId, userId });
      
      if (!gameId || !userId) {
        console.log('❌ Missing gameId or userId');
        return Response.json({ error: 'gameId و userId لازم است' }, { status: 400 });
      }

      const result = await markGameStarted(gameId, userId);
      console.log('🎯 markGameStarted result:', result);
      
      if (result.ok) {
        console.log('✅ Games played incremented to:', result.newCount);
        return Response.json({ 
          success: true, 
          message: 'Games played incremented', 
          newCount: result.newCount 
        });
      } else {
        console.log('ℹ️ First input already processed:', result.reason);
        return Response.json({ 
          success: false, 
          reason: result.reason 
        });
      }
    } else {
      return Response.json({ error: 'Action not found' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Game API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}