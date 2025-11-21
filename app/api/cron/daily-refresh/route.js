import { neon } from '@neondatabase/serverless';
import { getTodayIranDate, getTomorrowIranDate } from '@/lib/iran-date';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const tomorrowIran = getTomorrowIranDate(); // 🆕 فردا رو فعال کن
    const todayIran = getTodayIranDate(); // 🆕 امروز رو غیرفعال کن
    
    console.log('🔄 Daily refresh started:', {
      tomorrow: tomorrowIran,
      today: todayIran
    });
    
    // غیرفعال کردن پازل امروز ایران
    await sql`
      UPDATE monthly_puzzles 
      SET is_active = false 
      WHERE iran_date = ${todayIran}
    `;
    
    // فعال کردن پازل فردا ایران
    await sql`
      UPDATE monthly_puzzles 
      SET is_active = true 
      WHERE iran_date = ${tomorrowIran}
    `;
    
    console.log(`✅ Daily refresh: Activated ${tomorrowIran}, Deactivated ${todayIran}`);
    
    return Response.json({
      success: true,
      activated: tomorrowIran,
      deactivated: todayIran,
      timezone: 'Asia/Tehran'
    });
    
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}