import { neon } from '@neondatabase/serverless';
import { dailyPuzzleData } from '@/lib/dailyPuzzleData';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    
    console.log('📅 Daily puzzle request for:', today, 'Hour:', currentHour);

    // چک کردن ساعت - اگر بین ۸-۹ شب هست، بازی بسته است
    if (currentHour >= 20 && currentHour < 21) {
      console.log('⏸️ Game is closed (8-9 PM)');
      return Response.json({
        closed: true,
        title: 'بازی موقتاً تعطیل است',
        description: 'در حال به‌روزرسانی جدول جدید...',
        nextOpenTime: '۲۱:۰۰'
      }, { status: 423 });
    }

    // بررسی وجود جدول برای امروز
    const existingPuzzle = await sql`
      SELECT * FROM daily_puzzles WHERE date = ${today}
    `;

    if (existingPuzzle.length > 0) {
      console.log('✅ Existing puzzle found for today');
      
      // اگر ساعت از ۹ شب گذشته و بازی قبلاً کامل شده، وضعیت بسته برگردون
      if (currentHour >= 21 && existingPuzzle[0].completed) {
        return Response.json({
          closed: true,
          title: 'بازی امروز به پایان رسید',
          description: 'جدول فردا ساعت ۹ شب منتشر می‌شود',
          nextOpenTime: '۲۱:۰۰'
        }, { status: 423 });
      }
      
      return Response.json(existingPuzzle[0]);
      
    } else {
      // 🆕 روز جدید - ریست کردن امتیازهای امروز
      console.log('🔄 NEW DAY - Resetting today scores for all users');
      
      try {
        await sql`
          UPDATE user_profiles 
          SET 
            today_crossword_score = 0,
            today_game_completed = FALSE,
            instant_crossword_score = 0
          WHERE today_crossword_score > 0 OR today_game_completed = TRUE
        `;
        console.log('✅ All today scores reset to 0');
      } catch (error) {
        console.error('❌ Error resetting scores:', error);
      }

      // ایجاد جدول جدید برای امروز
      console.log('🎯 Creating new puzzle for:', today);
      
      const newPuzzle = {
        ...dailyPuzzleData,
        date: today,
        title: `جدول روزانه ${new Date().toLocaleDateString('fa-IR')}`,
        completed: false,
        created_at: new Date().toISOString()
      };

      // ذخیره جدول جدید در دیتابیس
      try {
        await sql`
          INSERT INTO daily_puzzles 
            (date, title, size, grid, solution, across, down, completed, created_at)
          VALUES (
            ${newPuzzle.date},
            ${newPuzzle.title},
            ${newPuzzle.size},
            ${JSON.stringify(newPuzzle.grid)},
            ${JSON.stringify(newPuzzle.solution)},
            ${JSON.stringify(newPuzzle.across)},
            ${JSON.stringify(newPuzzle.down)},
            ${newPuzzle.completed},
            ${newPuzzle.created_at}
          )
        `;
        console.log('✅ New daily puzzle saved to database');
      } catch (error) {
        console.error('❌ Error saving puzzle to database:', error);
        // بازگشت به داده‌های پیش‌فرض اگر خطا در ذخیره‌سازی بود
        return Response.json(newPuzzle);
      }

      // خواندن جدول ذخیره شده برای اطمینان
      const savedPuzzle = await sql`
        SELECT * FROM daily_puzzles WHERE date = ${today}
      `;

      if (savedPuzzle.length > 0) {
        console.log('✅ Returning saved puzzle from database');
        return Response.json(savedPuzzle[0]);
      } else {
        console.log('⚠️ Returning default puzzle data');
        return Response.json(newPuzzle);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in daily-puzzle API:', error);
    
    // بازگشت به داده‌های پیش‌فرض در صورت خطا
    const fallbackPuzzle = {
      ...dailyPuzzleData,
      date: new Date().toISOString().split('T')[0],
      title: `جدول روزانه ${new Date().toLocaleDateString('fa-IR')}`
    };
    
    return Response.json(fallbackPuzzle);
  }
}

export async function POST(request) {
  try {
    const { action, puzzleId } = await request.json();
    
    if (action === 'complete') {
      // علامت‌گذاری جدول به عنوان کامل شده
      await sql`
        UPDATE daily_puzzles 
        SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
        WHERE id = ${puzzleId}
      `;
      
      return Response.json({ success: true, message: 'Puzzle marked as completed' });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Error in daily-puzzle POST:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}