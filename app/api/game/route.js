import { createNewGame, updateGameProgress, completeGame, updateUserScore } from '@/lib/db';

export async function POST(request) {
  try {
    const { action, userId, gameData, score, mistakes } = await request.json();
    
    console.log('Game API called:', { action, userId, gameData: gameData ? 'exists' : 'missing' });

    if (action === 'start') {
      console.log('Starting new game for user:', userId);
      
      // شروع بازی جدید
      const newGame = await createNewGame(userId, gameData.puzzle);
      console.log('New game created:', newGame.id);
      
      return Response.json({ success: true, game: newGame });
    
    } else if (action === 'update') {
      console.log('Updating game progress:', { gameId: gameData.gameId, score, mistakes });
      
      // آپدیت پیشرفت بازی
      await updateGameProgress(gameData.gameId, gameData.progress, score, mistakes);
      return Response.json({ success: true });
    
    } else if (action === 'complete') {
      console.log('Completing game:', { gameId: gameData.gameId, score });
      
      // تکمیل بازی
      await completeGame(gameData.gameId, score);
      
      // آپدیت امتیاز کاربر
      await updateUserScore(userId, score, score);
      
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Action not found' }, { status: 400 });
    
  } catch (error) {
    console.error('Game API error details:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}