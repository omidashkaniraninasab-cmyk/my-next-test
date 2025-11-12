import { dailyPuzzleData } from '@/lib/dailyPuzzleData';

export async function GET() {
  try {
    // زمان به وقت ایران
    const now = new Date();
    const tehranOffset = 3.5 * 60 * 60 * 1000;
    const tehranTime = new Date(now.getTime() + tehranOffset);
    
    const currentHour = tehranTime.getHours();
    
    if (currentHour >= 20 && currentHour < 21) {
      // ساعت ۸ تا ۹ شب: بازی بسته
      console.log('⏸️ Game closed (20:00-21:00)');
      return Response.json({ 
        closed: true,
        message: '🎯 بازی در حال به‌روزرسانی است',
        description: 'ساعت ۹ شب با جدول جدید برگشتیم!',
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