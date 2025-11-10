import { saveGameToHistory } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId, gameId, puzzleData, score, mistakes } = await request.json();
    
    if (!userId || !gameId) {
      return Response.json({ error: 'User ID and Game ID required' }, { status: 400 });
    }

    // محاسبه زمان تکمیل (می‌تونید بعداً اضافه کنید)
    const completionTime = null;

    await saveGameToHistory(userId, gameId, puzzleData, score, mistakes, completionTime);

    return Response.json({ 
      success: true,
      message: 'بازی در تاریخچه ذخیره شد'
    });
    
  } catch (error) {
    console.error('Save history error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}