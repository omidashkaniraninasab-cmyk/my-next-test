import { neon } from '@neondatabase/serverless';
import { saveGameToHistory } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  console.log('🔍 SAVE-HISTORY API CALLED - START');
  
  try {
    const body = await request.json();
    console.log('🔍 Request body received:', JSON.stringify(body, null, 2));
    
    const { userId, gameId, puzzleData, mistakes, todayScore } = body;
    
    console.log('🔍 Parsed parameters:', {
      userId,
      gameId, 
      todayScore, // 🆕 این رو چک کن
      mistakes,
      hasPuzzleData: !!puzzleData
    });

    if (!userId || !gameId) {
      console.log('❌ Missing required fields:', { userId, gameId });
      return Response.json({ 
        error: 'User ID and Game ID required',
        received: { userId, gameId }
      }, { status: 400 });
    }

    console.log('💾 Starting to save game history...');
    
    const score = todayScore || 0; // 🆕 این درسته
    const completionTime = null;

    console.log('🔍 Calling saveGameToHistory function with score:', score);

    // 🆕 **درستش کن - todayScore رو پاس بده**
    const result = await saveGameToHistory(
      userId, 
      gameId, 
      puzzleData, 
      score, // 🎯 این todayScore هست که درست مقداردهی شده
      mistakes, 
      completionTime
    );
    
    console.log('✅ saveGameToHistory result:', result);

    return Response.json({ 
      success: true,
      message: 'بازی در تاریخچه ذخیره شد',
      score: score,
      historyId: result?.id
    });
    
  } catch (error) {
    console.error('❌ SAVE-HISTORY ERROR:', error.message);
    
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
}