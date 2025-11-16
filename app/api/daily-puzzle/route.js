import { dailyPuzzleData } from '@/lib/dailyPuzzleData';
import { resetDailyScores } from '@/lib/db';

export async function GET(request) {
  try {
    // فقط زمان ایران رو چک کن برای قفل ۸-۹ شب
    const now = new Date();
    const tehranOffset = 3.5 * 60 * 60 * 1000;
    const tehranTime = new Date(now.getTime() + tehranOffset);
    const currentHour = tehranTime.getHours();
    const currentMinute = tehranTime.getMinutes();
    
    console.log('🕒 Tehran time:', `${currentHour}:${currentMinute}`);
    
    // 🆕 **اگر ساعت ۹:۰۰-۹:۰۵ است، ریست روزانه انجام بده**
    if (currentHour === 21 && currentMinute <= 5) {
      console.log('🔄 Time for daily reset! Checking if reset is needed...');
      try {
        const resetCount = await resetDailyScores();
        console.log(`✅ Daily reset completed for ${resetCount} users`);
      } catch (resetError) {
        console.error('❌ Daily reset failed:', resetError);
      }
    }
    
    if (currentHour >= 20 && currentHour < 21) {
      console.log('⏸️ Game is closed (8-9 PM)');
      return Response.json({ 
        closed: true,
        message: '🎯 بازی در حال به‌روزرسانی است',
        description: 'ساعت ۹ شب با جدول جدید برمی‌گردیم!',
        nextOpenTime: '۲۱:۰۰'
      }, { status: 423 });
    }
    
    // همیشه از dailyPuzzleData استفاده کن
    console.log('✅ Serving main puzzle');
    return Response.json(dailyPuzzleData);
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json(dailyPuzzleData); // fallback
  }
}