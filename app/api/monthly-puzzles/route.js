import { neon } from '@neondatabase/serverless';
import { getTodayIranDate, getTomorrowIranDate } from '@/lib/iran-date';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    // 🆕 اگر بعد از ساعت ۹ شب 21 ایران هستیم، پازل فردا رو برگردون
    const now = new Date();
    const tehranTime = now.toLocaleString("en-US", {timeZone: "Asia/Tehran"});
    const date = new Date(tehranTime);
    const currentHour = date.getHours();
    
    const targetDate = currentHour >= 21 ? getTomorrowIranDate() : getTodayIranDate();
    
    console.log('🔍 Puzzle lookup:', {
      currentHour: currentHour,
      targetDate: targetDate,
      isTomorrow: currentHour >= 21
    });
    
    const puzzle = await sql`
      SELECT * FROM monthly_puzzles 
      WHERE iran_date = ${targetDate} AND is_active = true
      LIMIT 1
    `;

    if (puzzle.length === 0) {
      return Response.json({ error: 'No active puzzle found' }, { status: 404 });
    }

    return Response.json({
      date: puzzle[0].date,
      iran_date: puzzle[0].iran_date,
      puzzle_data: puzzle[0].puzzle_data,
      is_active: puzzle[0].is_active,
      is_tomorrow: currentHour >= 21 // 🆕 برای اطلاع کاربر
    });
    
  } catch (error) {
    console.error('Error fetching monthly puzzle:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}