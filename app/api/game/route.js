import { neon } from '@neondatabase/serverless';
import { createNewGame, markGameStarted } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId, gameData, userProgress, gameId } = body;
    
    console.log('🎮 Game API called:', { action, userId: userId ? String(userId).slice(0, 8) + '...' : 'none', gameId });
    console.log('🔍 Request details:', {
      hasGameData: !!gameData,
      gameDataKeys: gameData ? Object.keys(gameData) : 'no gameData',
      hasPuzzle: !!gameData?.puzzle,
      puzzleKeys: gameData?.puzzle ? Object.keys(gameData.puzzle) : 'no puzzle'
    });

    // 🔥 تبدیل userId به string برای اطمینان
    const stringUserId = String(userId || '');

    if (!stringUserId || stringUserId === 'undefined' || stringUserId === 'null') {
      console.log('❌ Invalid userId:', userId);
      return Response.json({ error: 'User ID is invalid' }, { status: 400 });
    }

    if (action === 'start') {
      console.log('🚀 Starting new game for user:', stringUserId);
      
      // 🆕 اگر gameData نداریم، خطا برگردان
      if (!gameData) {
        console.log('❌ No gameData provided');
        return Response.json({ 
          error: 'Game data is required',
          details: 'Please provide puzzle data'
        }, { status: 400 });
      }
      
      // 🆕 استفاده از gameData مستقیماً اگر puzzle نداریم
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
        // 🆕 ایجاد بازی با داده‌های کامل
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
        // 🆕 تبدیل gameId به number برای اطمینان
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
    } else {
      console.log('❌ Unknown action:', action);
      return Response.json({ 
        error: 'Action not found',
        supportedActions: ['start', 'first-input'] 
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ Game API error:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}