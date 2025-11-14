import { neon } from '@neondatabase/serverless';
import { saveGameToHistory } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId, gameId, puzzleData, mistakes, todayScore } = await request.json(); // 🆕 todayScore رو دریافت کن
    
    if (!userId || !gameId) {
      return Response.json({ error: 'User ID and Game ID required' }, { status: 400 });
    }

    console.log('💾 Saving game history with todayScore:', todayScore);

    // 🆕 از todayScore استفاده کن، نه از دیتابیس
    const score = todayScore; 
    const completionTime = null;

    await saveGameToHistory(userId, gameId, puzzleData, score, mistakes, completionTime);

    return Response.json({ 
      success: true,
      message: 'بازی در تاریخچه ذخیره شد',
      score: score // امتیاز امروز
    });
    
  } catch (error) {
    console.error('Save history error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}