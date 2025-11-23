import { neon } from '@neondatabase/serverless';
import { createNewGame, markGameStarted, incrementCompletedGames } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId, gameData, userProgress, gameId, score, mistakes } = body;
    
    console.log('🎮 Game API called:', { action, userId: userId ? String(userId).slice(0, 8) + '...' : 'none', gameId });

    // تبدیل userId به string برای اطمینان
    const stringUserId = String(userId || '');

    if (!stringUserId || stringUserId === 'undefined' || stringUserId === 'null') {
      console.log('❌ Invalid userId:', userId);
      return Response.json({ error: 'User ID is invalid' }, { status: 400 });
    }

    if (action === 'start') {
      console.log('🚀 Starting new game for user:', stringUserId);
      
      if (!gameData) {
        console.log('❌ No gameData provided');
        return Response.json({ 
          error: 'Game data is required',
          details: 'Please provide puzzle data'
        }, { status: 400 });
      }
      
      const puzzleToUse = gameData.puzzle || gameData;
      
      if (!puzzleToUse) {
        console.log('❌ No puzzle data available in gameData');
        return Response.json({ 
          error: 'Puzzle data is required',
          receivedData: Object.keys(gameData)
        }, { status: 400 });
      }

      console.log('✅ Using puzzle data:', {
        size: puzzleToUse.size,
        hasGrid: !!puzzleToUse.grid,
        hasSolution: !!puzzleToUse.solution,
        title: puzzleToUse.title
      });

      try {
        const game = await createNewGame(stringUserId, puzzleToUse);
        console.log('✅ Game creation successful:', { 
          gameId: game.id, 
          userId: game.user_id 
        });
        
        return Response.json({ 
          success: true, 
          game: {
            id: game.id,
            user_id: game.user_id,
            score: game.score,
            mistakes: game.mistakes,
            completed: game.completed,
            created_at: game.created_at
          }
        });
      } catch (dbError) {
        console.error('❌ Database error in createNewGame:', dbError);
        return Response.json({ 
          error: 'Database error',
          details: dbError.message 
        }, { status: 500 });
      }
      
    } else if (action === 'first-input') {
      console.log('🎯 first-input called with:', { gameId, userId: stringUserId });
      
      if (!gameId || !stringUserId) {
        console.log('❌ Missing gameId or userId');
        return Response.json({ 
          error: 'gameId و userId لازم است' 
        }, { status: 400 });
      }

      try {
        const numericGameId = parseInt(gameId);
        if (isNaN(numericGameId)) {
          console.log('❌ Invalid gameId:', gameId);
          return Response.json({ 
            error: 'gameId نامعتبر است' 
          }, { status: 400 });
        }

        const result = await markGameStarted(numericGameId, stringUserId);
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
      } catch (markError) {
        console.error('❌ Error in markGameStarted:', markError);
        return Response.json({ 
          error: 'Error processing first input',
          details: markError.message 
        }, { status: 500 });
      }
      
    } else if (action === 'complete') {
      console.log('🏁 Game completion called:', { gameId, userId: stringUserId, score, mistakes });
      
      if (!gameId || !stringUserId) {
        console.log('❌ Missing gameId or userId for completion');
        return Response.json({ 
          error: 'gameId و userId برای تکمیل بازی لازم است' 
        }, { status: 400 });
      }

      try {
        const numericGameId = parseInt(gameId);
        if (isNaN(numericGameId)) {
          console.log('❌ Invalid gameId for completion:', gameId);
          return Response.json({ 
            error: 'gameId نامعتبر است' 
          }, { status: 400 });
        }

        // 🔥 تغییر: games -> crossword_games
        const existingGame = await sql`
          SELECT completed FROM crossword_games WHERE id = ${numericGameId}
        `;
        
        if (existingGame.length > 0 && existingGame[0].completed) {
          console.log('⚠️ Game already completed, skipping...');
          return Response.json({ success: true, message: 'Game was already completed' });
        }

        // گرفتن user_code و display_name کاربر
        const user = await sql`
          SELECT user_code, display_name FROM user_profiles WHERE id = ${stringUserId}
        `;
        
        const userCode = user[0]?.user_code;
        const displayName = user[0]?.display_name;

        console.log('🎯 User details for completion:', { userCode, displayName });

        // 🔥 تغییر: games -> crossword_games
        const updateResult = await sql`
          UPDATE crossword_games 
          SET 
            completed = TRUE, 
            completed_at = CURRENT_TIMESTAMP, 
            finished_at = CURRENT_TIMESTAMP,
            ${score !== undefined ? sql`score = ${score},` : sql``}
            ${mistakes !== undefined ? sql`mistakes = ${mistakes},` : sql``}
            user_code = ${userCode},
            display_name = ${displayName}
          WHERE id = ${numericGameId}
          RETURNING id, completed, completed_at
        `;

        console.log('✅ Game completed with user details updated');

        // افزایش بازی‌های کامل
        await incrementCompletedGames(stringUserId);
        console.log('✅ Completed games count incremented');

        // آپدیت وضعیت کاربر
        await sql`
          UPDATE user_profiles 
          SET today_game_completed = TRUE
          WHERE id = ${stringUserId}
        `;

        console.log('✅ Game marked as completed');

        return Response.json({ 
          success: true,
          message: 'Game completed successfully',
          game: updateResult[0]
        });
        
      } catch (completeError) {
        console.error('❌ Error completing game:', completeError);
        return Response.json({ 
          error: 'Error completing game',
          details: completeError.message 
        }, { status: 500 });
      }
      
    } else {
      console.log('❌ Unknown action:', action);
      return Response.json({ 
        error: 'Action not found',
        supportedActions: ['start', 'first-input', 'complete'] 
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ Game API error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}