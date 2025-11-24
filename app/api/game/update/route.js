import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { gameId, userProgress, score, mistakes, userId } = await request.json();
    
    if (!gameId) {
      return Response.json({ error: 'Game ID required' }, { status: 400 });
    }

    console.log('🎯 Updating game state for gameId:', gameId);

    try {
      // 🆕 اگر userId ارائه شده، user_code و display_name رو آپدیت کن
      if (userId) {
        // گرفتن user_code و display_name کاربر
        const user = await sql`
          SELECT user_code, display_name FROM user_profiles WHERE id = ${userId}
        `;
        
        const userCode = user[0]?.user_code;
        const displayName = user[0]?.display_name;

        console.log('🎯 Updating game with user details:', { userCode, displayName });

        // آپدیت با فیلدهای جدید
        await sql`
          UPDATE crossword_games 
          SET 
            user_progress = ${JSON.stringify(userProgress)},
            score = ${score},
            mistakes = ${mistakes},
            finished_at = CURRENT_TIMESTAMP,
            user_code = ${userCode},
            display_name = ${displayName}
          WHERE id = ${gameId}
        `;
      } else {
        // اگر userId ارائه نشده، فقط فیلدهای اصلی رو آپدیت کن
        await sql`
          UPDATE crossword_games 
          SET 
            user_progress = ${JSON.stringify(userProgress)},
            score = ${score},
            mistakes = ${mistakes},
            finished_at = CURRENT_TIMESTAMP
          WHERE id = ${gameId}
        `;
      }

      console.log('✅ Game state updated successfully');
      
      return Response.json({ 
        success: true,
        message: 'Game state updated'
      });

    } catch (updateError) {
      console.error('❌ Update with user fields failed, trying fallback...', updateError);
      
      // 🆕 Fallback: آپدیت بدون فیلدهای کاربر
      try {
        await sql`
          UPDATE crossword_games 
          SET 
            user_progress = ${JSON.stringify(userProgress)},
            score = ${score},
            mistakes = ${mistakes},
            finished_at = CURRENT_TIMESTAMP
          WHERE id = ${gameId}
        `;
        
        console.log('✅ Game state updated (fallback)');
        
        return Response.json({ 
          success: true,
          message: 'Game state updated (fallback)'
        });
        
      } catch (fallbackError) {
        console.error('❌ Fallback update also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
  } catch (error) {
    console.error('❌ Game update error:', error);
    return Response.json({ 
      error: error.message,
      details: 'خطا در آپدیت وضعیت بازی'
    }, { status: 500 });
  }
}