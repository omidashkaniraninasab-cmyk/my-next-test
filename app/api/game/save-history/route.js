import { neon } from '@neondatabase/serverless';
import { saveGameToHistory } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  console.log('🔍 SAVE-HISTORY API CALLED - START');
  
  try {
    // لاگ request کامل
    console.log('🔍 Request headers:', Object.fromEntries(request.headers));
    
    const body = await request.json();
    console.log('🔍 Request body received:', JSON.stringify(body, null, 2));
    
    const { userId, gameId, puzzleData, mistakes, todayScore } = body;
    
    console.log('🔍 Parsed parameters:', {
      userId,
      gameId, 
      todayScore,
      mistakes,
      hasPuzzleData: !!puzzleData,
      puzzleDataKeys: puzzleData ? Object.keys(puzzleData) : 'NO_PUZZLE_DATA'
    });

    // اعتبارسنجی پارامترها
    if (!userId || !gameId) {
      console.log('❌ Missing required fields:', { userId, gameId });
      return Response.json({ 
        error: 'User ID and Game ID required',
        received: { userId, gameId }
      }, { status: 400 });
    }

    console.log('💾 Starting to save game history...');
    
    const score = todayScore || 0;
    const completionTime = null;

    console.log('🔍 Calling saveGameToHistory function with:', {
      userId,
      gameId,
      puzzleTitle: puzzleData?.title,
      puzzleSize: puzzleData?.size,
      score,
      mistakes
    });

    // تست connection دیتابیس
    try {
      const testConnection = await sql`SELECT 1 as test`;
      console.log('✅ Database connection test:', testConnection);
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      throw new Error(`Database connection error: ${dbError.message}`);
    }

    // ذخیره تاریخچه
    const result = await saveGameToHistory(userId, gameId, puzzleData, score, mistakes, completionTime);
    
    console.log('✅ saveGameToHistory result:', result);

    return Response.json({ 
      success: true,
      message: 'بازی در تاریخچه ذخیره شد',
      score: score,
      historyId: result?.id
    });
    
  } catch (error) {
    console.error('❌ SAVE-HISTORY ERROR:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    
    return Response.json({ 
      success: false,
      error: error.message,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}