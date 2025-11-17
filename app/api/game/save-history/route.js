import { neon } from '@neondatabase/serverless';

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
      todayScore,
      mistakes
    });

    if (!userId || !gameId) {
      return Response.json({ 
        error: 'User ID and Game ID required'
      }, { status: 400 });
    }

    console.log('💾 Starting DIRECT database insert...');
    
    const score = todayScore || 0;
// در endpoint تاریخچه - این رو جایگزین کن
const now = new Date().toISOString(); // زمان از JavaScript
    // 🆕 INSERT مستقیم به دیتابیس
   const result = await sql`
  INSERT INTO game_history (
    user_id, 
    game_id, 
    puzzle_title, 
    puzzle_size, 
    score, 
    mistakes, 
    completion_time,
    created_at
  ) 
  VALUES (
    ${userId}, 
    ${gameId}, 
    ${puzzleData?.title || 'جدول روزانه'}, 
    ${puzzleData?.size || 6}, 
    ${score}, 
    ${mistakes}, 
    ${null},
    ${now}  -- 🎯 زمان از JavaScript
  )
  RETURNING id, score, created_at
`;

    console.log('✅ DIRECT INSERT - Result:', result[0]);

    return Response.json({ 
      success: true,
      message: 'بازی در تاریخچه ذخیره شد',
      score: score,
      historyId: result[0]?.id,
      createdAt: result[0]?.created_at
    });
    
  } catch (error) {
    console.error('❌ SAVE-HISTORY ERROR:', error.message);
    
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
}