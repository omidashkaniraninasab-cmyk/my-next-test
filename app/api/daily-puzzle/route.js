import { dailyPuzzleData } from '@/lib/dailyPuzzleData';
import { sql } from '@neondatabase/serverless';
import { incrementIncompleteGames } from '@/lib/db';
import { neon } from '@neondatabase/serverless';

const neonSql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    // زمان به وقت ایران
    const now = new Date();
    const tehranOffset = 3.5 * 60 * 60 * 1000;
    const tehranTime = new Date(now.getTime() + tehranOffset);
    
    const currentHour = tehranTime.getHours();
    
    if (currentHour >= 20 && currentHour < 21) {
      // ساعت ۸ تا ۹ شب: بازی بسته
      console.log('⏸️ Game closed (20:00-21:00)');
      
      // ✅ مهم: بازی‌های ناتمام امروز را شمارش کن
      try {
        // تمام کاربرانی که امروز بازی شروع کردند اما کامل نکردند
        const incompleteUsers = await neonSql`
          SELECT DISTINCT up.id
          FROM user_profiles up
          INNER JOIN crossword_games cg ON up.id = cg.user_id
          WHERE 
            DATE(cg.started_at) = CURRENT_DATE 
            AND cg.completed = FALSE
            AND up.today_game_completed = FALSE
        `;
        
        console.log(`📊 Found ${incompleteUsers.length} incomplete games today`);
        
        // ✅ برای هر کاربر ناتمام +1 کن
        for (const user of incompleteUsers) {
          await incrementIncompleteGames(user.id);
          console.log(`✅ Incomplete game marked for user: ${user.id}`);
        }
        
        // ✅ بازی‌های ناتمام را lock کن (today_game_completed = TRUE)
        await neonSql`
          UPDATE user_profiles
          SET today_game_completed = TRUE
          WHERE id IN (${incompleteUsers.map(u => u.id).join(',')})
        `;
        
        console.log('🔒 All incomplete games locked');
      } catch (dbError) {
        console.error('⚠️ Error processing incomplete games:', dbError);
      }
      
      return Response.json({ 
        closed: true,
        message: '🎯 بازی در حال به‌روزرسانی است',
        description: 'ساعت ۹ شب با جدول جدید بر می گردیم!',
        nextOpenTime: '۲۱:۰۰'
      }, { status: 423 }); // 423 = Locked
    }
    
    // خارج از ساعت ۸-۹: بازی باز
    console.log('✅ Game open - serving puzzle');
    return Response.json(dailyPuzzleData);
    
  } catch (error) {
    console.error('❌ Error serving daily puzzle:', error);
    return Response.json({ error: 'Failed to load puzzle' }, { status: 500 });
  }
}