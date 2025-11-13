import { dailyPuzzleData } from '@/lib/dailyPuzzleData';
import { sql } from '@neondatabase/serverless';
import { incrementIncompleteGames } from '@/lib/db';
import { neon } from '@neondatabase/serverless';

const neonSql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    // زمان به وقت ایران
    const now = new Date();
    const tehranOffset = 3.5 * 60 * 60 * 1000; // +3:30
    const tehranTime = new Date(now.getTime() + tehranOffset);
    
    const currentHour = tehranTime.getHours();
    const currentMinute = tehranTime.getMinutes();
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`🕒 Tehran time: ${tehranTime}, Hour: ${currentHour}, Minute: ${currentMinute}`);
    
    // 🆕 **شرط دقیق‌تر برای ساعت ۸-۹ شب**
    const isMaintenanceTime = (currentHour === 20) || 
                             (currentHour === 21 && currentMinute === 0); // فقط دقیقه ۰ از ساعت ۲۱
    
    if (isMaintenanceTime) {
      // ساعت ۸ شب تا ۹ شب (دقیقه ۰): بازی بسته
      console.log('⏸️ Game closed (20:00-21:00 maintenance time)');
      
    // بخش شمارش بازی‌های ناتمام - نسخه اصلاح شده و درست
try {
  console.log('🔍 Checking for incomplete games...');
  
  // فقط کاربرانی که واقعاً بازی ناتمام دارن امروز
  const incompleteUsers = await neonSql`
    SELECT up.id, up.username
    FROM user_profiles up
    WHERE EXISTS (
      SELECT 1 
      FROM crossword_games cg 
      WHERE cg.user_id = up.id 
      AND DATE(cg.started_at) = CURRENT_DATE 
      AND cg.completed = FALSE
      AND cg.id IS NOT NULL
    )
    AND up.today_game_completed = FALSE
  `;
  
  console.log(`📊 Found ${incompleteUsers.length} users with ACTIVE incomplete games today`);
  
  // فقط برای کاربرانی که واقعاً بازی ناتمام دارن
  const userIds = incompleteUsers.map(u => u.id);
  if (userIds.length > 0) {
    console.log('👥 Users with incomplete games:', incompleteUsers.map(u => u.username));
    
    for (const user of incompleteUsers) {
      await incrementIncompleteGames(user.id);
      console.log(`✅ Incomplete game counted for user: ${user.username} (${user.id})`);
    }
    
    // فقط این کاربران رو mark کن
    await neonSql`
      UPDATE user_profiles 
      SET today_game_completed = TRUE 
      WHERE id IN (${userIds.join(',')})
    `;
    
    console.log(`🔒 Marked ${userIds.length} users as completed (incomplete games)`);
  } else {
    console.log('ℹ️ No users with incomplete games found');
  }
  
} catch (dbError) {
  console.error('⚠️ Error processing incomplete games:', dbError);
}
      return Response.json({ 
        closed: true,
        message: '🎯 بازی در حال به‌روزرسانی است',
        description: 'ساعت ۹ شب با جدول جدید بر می گردیم!',
        nextOpenTime: '۲۱:۰۰'
      }, { status: 423 });
    }
    
    // 🆕 **بازی باز - پازل امروز رو برگردون**
    console.log('✅ Game open - serving today\'s puzzle');
    
    try {
      // اول از دیتابیس چک کن
      const todayPuzzle = await neonSql`
        SELECT * FROM daily_puzzles 
        WHERE date = ${today} 
        AND is_active = true
        LIMIT 1
      `;
      
      if (todayPuzzle.length > 0) {
        console.log('✅ Today\'s puzzle found in database');
        return Response.json(todayPuzzle[0].puzzle_data);
      } else {
        console.log('❌ No puzzle found for today, using fallback');
        return Response.json(dailyPuzzleData);
      }
      
    } catch (dbError) {
      console.error('❌ Database error, using fallback:', dbError);
      return Response.json(dailyPuzzleData);
    }
    
  } catch (error) {
    console.error('❌ Error serving daily puzzle:', error);
    return Response.json(dailyPuzzleData);
  }
}