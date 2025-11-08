import { createNewGame, updateGameProgress, completeGame, updateUserScore } from '@/lib/db';

export async function POST(request) {
  try {
    const { action, userId, gameData, score, mistakes } = await request.json();
    
    if (action === 'start') {
      // شروع بازی جدید
      const newGame = await createNewGame(userId, gameData.puzzle);
      return Response.json({ success: true, game: newGame });
    
    } else if (action === 'update') {
      // آپدیت پیشرفت بازی
      await updateGameProgress(gameData.gameId, gameData.progress, score, mistakes);
      return Response.json({ success: true });
    
    } else if (action === 'complete') {
      // تکمیل بازی
      await completeGame(gameData.gameId, score);
      
      // آپدیت امتیاز کاربر
      await updateUserScore(userId, score, score);
      
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Action not found' }, { status: 400 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}