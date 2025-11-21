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
    const now = new Date().toISOString();

    // 🆕 گرفتن user_code و display_name کاربر با هندلینگ خطا
    let userCode = null;
    let displayName = null;
    
    try {
      const user = await sql`
        SELECT user_code, display_name FROM user_profiles WHERE id = ${userId}
      `;
      
      if (user && user.length > 0) {
        userCode = user[0]?.user_code;
        displayName = user[0]?.display_name;
      }
      
      console.log('🎯 User details for history:', { userCode, displayName });
    } catch (userError) {
      console.warn('⚠️ Could not fetch user details:', userError.message);
      // ادامه بده حتی اگر گرفتن user details با خطا مواجه شد
    }

    // 🆕 INSERT مستقیم به دیتابیس با هندلینگ خطا
    try {
      const result = await sql`
        INSERT INTO game_history (
          user_id, 
          game_id, 
          puzzle_title, 
          puzzle_size, 
          score, 
          mistakes, 
          completion_time,
          created_at,
          user_code,
          display_name
        ) 
        VALUES (
          ${userId}, 
          ${gameId}, 
          ${puzzleData?.title || 'جدول روزانه'}, 
          ${puzzleData?.size || 6}, 
          ${score}, 
          ${mistakes}, 
          ${null},
          ${now},
          ${userCode},
          ${displayName}
        )
        RETURNING id, score, created_at, user_code, display_name
      `;

      console.log('✅ DIRECT INSERT - Success:', result[0]);

      return Response.json({ 
        success: true,
        message: 'بازی در تاریخچه ذخیره شد',
        score: score,
        historyId: result[0]?.id,
        createdAt: result[0]?.created_at,
        userCode: result[0]?.user_code,
        displayName: result[0]?.display_name
      });
      
    } catch (insertError) {
      console.error('❌ INSERT ERROR:', insertError.message);
      
      // 🆕 تلاش برای INSERT بدون فیلدهای جدید (fallback)
      try {
        console.log('🔄 Trying fallback INSERT without user fields...');
        const fallbackResult = await sql`
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
            ${now}
          )
          RETURNING id, score, created_at
        `;

        console.log('✅ FALLBACK INSERT - Success:', fallbackResult[0]);

        return Response.json({ 
          success: true,
          message: 'بازی در تاریخچه ذخیره شد (fallback)',
          score: score,
          historyId: fallbackResult[0]?.id,
          createdAt: fallbackResult[0]?.created_at
        });
        
      } catch (fallbackError) {
        console.error('❌ FALLBACK INSERT ALSO FAILED:', fallbackError.message);
        throw fallbackError;
      }
    }
    
  } catch (error) {
    console.error('❌ SAVE-HISTORY FINAL ERROR:', error.message);
    console.error('❌ Error details:', error);
    
    return Response.json({ 
      success: false,
      error: error.message,
      details: 'خطا در ذخیره تاریخچه بازی'
    }, { status: 500 });
  }
}